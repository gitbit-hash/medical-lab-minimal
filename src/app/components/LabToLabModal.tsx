// components/LabToLabModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { IoClose, IoAdd, IoFlaskOutline, IoRefresh, IoTrashOutline, IoChevronDown } from 'react-icons/io5';
import { useTranslations } from 'next-intl';
import { Dialog } from './Dialog';

interface ExternalLab {
	id: string;
	name: string;
	contact_number?: string;
	address?: string;
	email?: string;
}

interface LabToLabModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAssign: (labId: string, price: number, testId: string) => Promise<void>;
	onRemoveAssignment: (testId: string) => Promise<void>;
	onDeleteLab: (labId: string) => Promise<void>; // New prop for deleting lab
	onAddLab: (labData: Omit<ExternalLab, 'id'>) => Promise<ExternalLab>;
	testId: string;
	currentAssignment?: {
		labId: string;
		labName: string;
		price: number;
	};
	labs: ExternalLab[];
	isLoadingLabs?: boolean;
	onRefreshLabs?: () => Promise<void>;
	locale?: string;
	currencySymbol?: string;
}

export function LabToLabModal({
	isOpen,
	onClose,
	onAssign,
	onRemoveAssignment,
	onDeleteLab, // Add this
	onAddLab,
	testId,
	currentAssignment,
	labs,
	isLoadingLabs = false,
	onRefreshLabs,
	locale = 'en',
	currencySymbol = '$'
}: LabToLabModalProps) {
	const t = useTranslations('LabToLabModal');
	const direction = locale === 'ar' ? 'rtl' : 'ltr';

	const [selectedLabId, setSelectedLabId] = useState<string>(currentAssignment?.labId || '');
	const [price, setPrice] = useState<string>(currentAssignment?.price?.toString() || '');
	const [isLoading, setIsLoading] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);
	const [isDeletingLab, setIsDeletingLab] = useState<string | null>(null); // Track which lab is being deleted
	const [showAddLabForm, setShowAddLabForm] = useState(false);
	const [newLab, setNewLab] = useState({
		name: '',
		contact_number: '',
		address: '',
		email: ''
	});
	const [isAddingLab, setIsAddingLab] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	// Refs for handling click outside
	const dropdownRef = useRef<HTMLDivElement>(null);
	const selectButtonRef = useRef<HTMLButtonElement>(null);

	// Dialog state
	const [dialog, setDialog] = useState({
		isOpen: false,
		title: '',
		message: '',
		type: 'alert' as 'confirm' | 'alert' | 'info' | 'success' | 'warning' | 'error',
		confirmText: 'OK',
		cancelText: 'Cancel',
		onConfirm: () => { },
		onCancel: () => { },
		isDestructive: false
	});

	// Reset form when modal opens/closes or test changes
	useEffect(() => {
		if (isOpen && currentAssignment) {
			setSelectedLabId(currentAssignment.labId);
			setPrice(currentAssignment.price.toString());
		} else if (isOpen) {
			setSelectedLabId('');
			setPrice('');
		}
	}, [isOpen, currentAssignment]);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				selectButtonRef.current &&
				!selectButtonRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const showDialog = (
		title: string,
		message: string,
		type: 'confirm' | 'alert' | 'info' | 'success' | 'warning' | 'error' = 'alert',
		options?: {
			confirmText?: string;
			cancelText?: string;
			onConfirm?: () => void;
			onCancel?: () => void;
			isDestructive?: boolean;
		}
	) => {
		setDialog({
			isOpen: true,
			title,
			message,
			type,
			confirmText: options?.confirmText || 'OK',
			cancelText: options?.cancelText || 'Cancel',
			onConfirm: options?.onConfirm || (() => closeDialog()),
			onCancel: options?.onCancel || (() => closeDialog()),
			isDestructive: options?.isDestructive || false
		});
	};

	const closeDialog = () => {
		setDialog(prev => ({ ...prev, isOpen: false }));
	};

	const handleAssign = async () => {
		if (!selectedLabId || !price) {
			showDialog(
				t('alerts.selectLabAndPriceTitle') || 'Missing Information',
				t('alerts.selectLabAndPrice') || 'Please select a lab and enter a price',
				'warning'
			);
			return;
		}

		setIsLoading(true);
		try {
			await onAssign(selectedLabId, parseFloat(price), testId);
			onClose();
		} catch (error) {
			console.error('Failed to assign lab:', error);
			// Error is handled in parent component
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemoveAssignment = async () => {
		if (!currentAssignment) return;

		showDialog(
			t('alerts.confirmRemoveTitle') || 'Confirm Removal',
			t('alerts.confirmRemove') || 'Are you sure you want to remove this lab assignment?',
			'confirm',
			{
				confirmText: t('buttons.removeAssignment') || 'Remove',
				cancelText: t('buttons.cancel') || 'Cancel',
				isDestructive: true,
				onConfirm: async () => {
					setIsRemoving(true);
					try {
						await onRemoveAssignment(testId);
						onClose();
					} catch (error) {
						console.error('Failed to remove assignment:', error);
						showDialog(
							t('alerts.removeFailedTitle') || 'Error',
							t('alerts.removeFailed') || 'Failed to remove lab assignment',
							'error'
						);
					} finally {
						setIsRemoving(false);
					}
				},
				onCancel: () => {
					// Just close the dialog, do nothing
				}
			}
		);
	};

	const handleDeleteLab = async (labId: string, labName: string) => {
		// Don't allow deleting if this lab is currently assigned to the test
		if (currentAssignment?.labId === labId) {
			showDialog(
				t('alerts.cannotDeleteAssignedTitle') || 'Cannot Delete',
				t('alerts.cannotDeleteAssigned') || 'Cannot delete a lab that is currently assigned to this test. Please remove the assignment first.',
				'warning'
			);
			return;
		}

		showDialog(
			t('alerts.confirmDeleteLabTitle') || 'Confirm Delete',
			t('alerts.confirmDeleteLab', { labName }) || `Are you sure you want to delete "${labName}"?`,
			'confirm',
			{
				confirmText: t('buttons.delete') || 'Delete',
				cancelText: t('buttons.cancel') || 'Cancel',
				isDestructive: true,
				onConfirm: async () => {
					setIsDeletingLab(labId);
					try {
						await onDeleteLab(labId);
						// If the deleted lab was selected, clear the selection
						if (selectedLabId === labId) {
							setSelectedLabId('');
						}
						showDialog(
							t('alerts.labDeletedTitle') || 'Success',
							t('alerts.labDeleted', { labName }) || `Lab "${labName}" has been deleted successfully`,
							'success'
						);
					} catch (error) {
						console.error('Failed to delete lab:', error);
						showDialog(
							t('alerts.deleteLabFailedTitle') || 'Error',
							t('alerts.deleteLabFailed') || 'Failed to delete lab',
							'error'
						);
					} finally {
						setIsDeletingLab(null);
					}
				},
				onCancel: () => {
					// Just close the dialog, do nothing
				}
			}
		);
	};

	const handleAddLab = async () => {
		if (!newLab.name.trim()) {
			showDialog(
				t('alerts.labNameRequiredTitle') || 'Missing Information',
				t('alerts.labNameRequired') || 'Lab name is required',
				'warning'
			);
			return;
		}

		setIsAddingLab(true);
		try {
			const createdLab = await onAddLab(newLab);
			setSelectedLabId(createdLab.id);
			setShowAddLabForm(false);
			setNewLab({ name: '', contact_number: '', address: '', email: '' });
		} catch (error) {
			console.error('Failed to add lab:', error);
			showDialog(
				t('alerts.addLabFailedTitle') || 'Error',
				t('alerts.addLabFailed') || 'Failed to add lab',
				'error'
			);
		} finally {
			setIsAddingLab(false);
		}
	};

	const handleRefreshLabs = async () => {
		if (onRefreshLabs) {
			await onRefreshLabs();
		}
	};

	const getSelectedLabName = () => {
		if (!selectedLabId) return t('selectPlaceholder.selectLab');
		const lab = labs.find(l => l.id === selectedLabId);
		return lab ? lab.name : t('selectPlaceholder.selectLab');
	};

	if (!isOpen) return null;

	return (
		<>
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir={direction}>
				<div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
					<div className="p-6">
						<div className="flex justify-between items-center mb-6">
							<div className="flex items-center">
								<IoFlaskOutline className="h-6 w-6 text-purple-600 mr-2" />
								<h3 className="text-xl font-semibold text-gray-900">
									{currentAssignment ? t('titles.editAssignment') : t('titles.assignToLab')}
								</h3>
							</div>
							<button
								onClick={onClose}
								className="text-gray-400 hover:text-gray-600"
								aria-label={t('buttons.close')}
							>
								<IoClose className="h-6 w-6" />
							</button>
						</div>

						{!showAddLabForm ? (
							<>
								<div className="space-y-4">
									<div>
										<div className="flex justify-between items-center mb-2">
											<label className="block text-sm font-medium text-gray-700">
												{t('labels.selectLab')}
											</label>
											<button
												onClick={handleRefreshLabs}
												className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
												title={t('buttons.refresh')}
											>
												<IoRefresh className="h-3 w-3 mr-1" />
												{t('buttons.refresh')}
											</button>
										</div>

										{/* Custom Dropdown for Labs with Delete Options */}
										<div className="relative" ref={dropdownRef}>
											<button
												ref={selectButtonRef}
												type="button"
												onClick={() => setIsDropdownOpen(!isDropdownOpen)}
												className={`relative w-full text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm ${locale === 'ar' ? 'pr-3 pl-10' : 'pl-3 pr-10'
													} py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
												disabled={isLoadingLabs}
											>
												<span className={`block truncate ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{getSelectedLabName()}</span>
												<span className={`absolute inset-y-0 ${locale === 'ar' ? 'left-0 pl-3 text-right' : 'right-0 pr-3'
													} flex items-center pointer-events-none`}>
													<IoChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
												</span>
											</button>

											{isDropdownOpen && (
												<div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
													{isLoadingLabs ? (
														<div className="px-3 py-2 text-gray-500 text-center">
															{t('messages.loadingLabs')}
														</div>
													) : labs.length === 0 ? (
														<div className="px-3 py-2 text-gray-500 text-center">
															{t('messages.noLabsFound')}
														</div>
													) : (
														labs.map((lab) => (
															<div
																key={lab.id}
																className={`flex items-center justify-between hover:bg-gray-100 ${selectedLabId === lab.id ? 'bg-purple-50' : ''
																	}`}
															>
																{/* For Arabic, swap the order of elements */}
																{locale === 'ar' ? (
																	<>
																		{/* Lab name on the right for Arabic */}
																		<button
																			type="button"
																			className="flex-1  px-3 py-2"
																			onClick={() => {
																				setSelectedLabId(lab.id);
																				setIsDropdownOpen(false);
																			}}
																		>
																			<div className="flex items-center ">
																				<span className={`${selectedLabId === lab.id ? 'font-semibold text-purple-700' : 'font-normal text-gray-900'
																					}`}>
																					{lab.name}
																				</span>
																			</div>
																		</button>
																		{/* Delete button on the left for Arabic */}
																		<button
																			type="button"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleDeleteLab(lab.id, lab.name);
																			}}
																			disabled={isDeletingLab === lab.id}
																			className="px-3 py-2 text-red-600 hover:text-red-900 disabled:opacity-50"
																			title={t('buttons.deleteLab')}
																		>
																			{isDeletingLab === lab.id ? (
																				<svg className="animate-spin h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
																					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
																					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
																				</svg>
																			) : (
																				<IoTrashOutline className="h-4 w-4" />
																			)}
																		</button>

																	</>
																) : (
																	<>
																		{/* Original order for LTR languages */}
																		<button
																			type="button"
																			className="flex-1 text-left px-3 py-2"
																			onClick={() => {
																				setSelectedLabId(lab.id);
																				setIsDropdownOpen(false);
																			}}
																		>
																			<div className="flex items-center">
																				<span className={`${selectedLabId === lab.id ? 'font-semibold text-purple-700' : 'font-normal text-gray-900'
																					}`}>
																					{lab.name}
																				</span>
																			</div>
																		</button>
																		<button
																			type="button"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleDeleteLab(lab.id, lab.name);
																			}}
																			disabled={isDeletingLab === lab.id}
																			className="px-3 py-2 text-red-600 hover:text-red-900 disabled:opacity-50"
																			title={t('buttons.deleteLab')}
																		>
																			{isDeletingLab === lab.id ? (
																				<svg className="animate-spin h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
																					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
																					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
																				</svg>
																			) : (
																				<IoTrashOutline className="h-4 w-4" />
																			)}
																		</button>
																	</>
																)}
															</div>
														))
													)}

													{/* Add New Lab Button */}
													<button
														type="button"
														className={`w-full ${locale === 'ar' ? 'text-right' : 'text-left'
															} px-3 py-2 text-purple-600 hover:bg-purple-50 flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''
															} border-t border-gray-100`}
														onClick={() => {
															setIsDropdownOpen(false);
															setShowAddLabForm(true);
														}}
													>
														<IoAdd className={`h-4 w-4 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
														{t('buttons.addNewLab')}
													</button>
												</div>
											)}
										</div>

										{isLoadingLabs && (
											<p className="text-xs text-gray-500 mt-1">{t('messages.loadingLabs')}</p>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											{t('labels.price')}
										</label>
										<div className="flex">
											{locale === 'ar' ? (
												<>
													<input
														type="number"
														value={price}
														onChange={(e) => setPrice(e.target.value)}
														className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
														placeholder={t('placeholders.price')}
														min="0"
														step="0.01"
													/>
													<span className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
														{currencySymbol}
													</span>
												</>
											) : (
												<>
													<span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
														{currencySymbol}
													</span>
													<input
														type="number"
														value={price}
														onChange={(e) => setPrice(e.target.value)}
														className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
														placeholder={t('placeholders.price')}
														min="0"
														step="0.01"
													/>
												</>
											)}
										</div>
									</div>

									{currentAssignment && (
										<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
											<p className="text-sm text-yellow-800">
												{t('messages.currentAssignment', {
													labName: currentAssignment.labName,
													price: currentAssignment.price.toFixed(2)
												})}
											</p>
										</div>
									)}
								</div>

								{/* Buttons section */}
								<div className={`flex ${locale === 'ar' ? 'space-x-reverse' : ''} space-x-3 pt-6`}>
									{currentAssignment ? (
										// When there's an existing assignment
										<>
											<button
												onClick={handleRemoveAssignment}
												disabled={isRemoving || isLoading}
												className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
											>
												{isRemoving ? (
													<svg className="animate-spin h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
													</svg>
												) : (
													<>
														<IoTrashOutline className="h-5 w-5 mr-2" />
														{t('buttons.removeAssignment')}
													</>
												)}
											</button>
											<button
												onClick={onClose}
												className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
												disabled={isLoading || isRemoving}
											>
												{t('buttons.cancel')}
											</button>
											<button
												onClick={handleAssign}
												disabled={!selectedLabId || !price || isLoading || isLoadingLabs || isRemoving}
												className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
											>
												{isLoading ? (
													<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
													</svg>
												) : (
													t('buttons.updateAssignment')
												)}
											</button>
										</>
									) : (
										// When there's no existing assignment
										<>
											<button
												onClick={onClose}
												className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
												disabled={isLoading}
											>
												{t('buttons.cancel')}
											</button>
											<button
												onClick={handleAssign}
												disabled={!selectedLabId || !price || isLoading || isLoadingLabs}
												className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
											>
												{isLoading ? (
													<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
													</svg>
												) : (
													t('buttons.assignToLab')
												)}
											</button>
										</>
									)}
								</div>
							</>
						) : (
							<>
								<div className="space-y-4">
									<h4 className="font-medium text-gray-900">{t('titles.addNewLab')}</h4>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											{t('labels.labName')} *
										</label>
										<input
											type="text"
											value={newLab.name}
											onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
											placeholder={t('placeholders.labName')}
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											{t('labels.contactNumber')}
										</label>
										<input
											type="tel"
											value={newLab.contact_number}
											onChange={(e) => setNewLab({ ...newLab, contact_number: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
											placeholder={t('placeholders.contactNumber')}
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											{t('labels.address')}
										</label>
										<textarea
											value={newLab.address}
											onChange={(e) => setNewLab({ ...newLab, address: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
											placeholder={t('placeholders.address')}
											rows={3}
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											{t('labels.email')}
										</label>
										<input
											type="email"
											value={newLab.email}
											onChange={(e) => setNewLab({ ...newLab, email: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
											placeholder={t('placeholders.email')}
										/>
									</div>
								</div>

								<div className={`flex ${locale === 'ar' ? 'space-x-reverse' : ''} space-x-3 pt-6`}>
									<button
										onClick={() => setShowAddLabForm(false)}
										className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
										disabled={isAddingLab}
									>
										{t('buttons.back')}
									</button>
									<button
										onClick={handleAddLab}
										disabled={!newLab.name.trim() || isAddingLab}
										className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
									>
										{isAddingLab ? (
											<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
											</svg>
										) : (
											t('buttons.saveLab')
										)}
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Dialog Component */}
			<Dialog
				isOpen={dialog.isOpen}
				title={dialog.title}
				message={dialog.message}
				type={dialog.type}
				confirmText={dialog.confirmText}
				cancelText={dialog.cancelText}
				onConfirm={dialog.onConfirm}
				onCancel={dialog.onCancel}
				onClose={closeDialog}
				isDestructive={dialog.isDestructive}
			/>
		</>
	);
}