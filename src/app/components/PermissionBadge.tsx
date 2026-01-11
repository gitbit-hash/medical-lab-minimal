// Create a permission badge component
export function PermissionBadge({ hasPermission, label }: { hasPermission: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hasPermission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {hasPermission ? '✓' : '✗'} {label}
    </span>
  );
}

// Use in your user list or edit form to show permissions at a glance
{/* <div className="flex flex-wrap gap-1 mt-2">
  <PermissionBadge hasPermission={user.can_create_test_templates} label="Create" />
  <PermissionBadge hasPermission={user.can_edit_test_templates} label="Edit" />
  <PermissionBadge hasPermission={user.can_delete_test_templates} label="Delete" />
  <PermissionBadge hasPermission={user.can_edit_fees} label="Edit Fees" />
  <PermissionBadge hasPermission={user.can_edit_reference_ranges} label="Edit Ranges" />
</div> */}