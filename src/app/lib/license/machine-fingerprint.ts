// lib/license/machine-fingerprint.ts
/**
 * Machine Fingerprint Generator
 * Generates a unique identifier for the current machine
 * Used to bind licenses to a specific machine
 */

import * as os from 'os';
import * as crypto from 'crypto';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

/**
 * Gets disk serial number/ID for different platforms
 */
async function getDiskInfo(): Promise<string[]> {
  const diskInfo: string[] = [];

  try {
    switch (process.platform) {
      case 'win32':
        // Windows - using wmic to get disk drive serial number
        try {
          const result = execSync('wmic diskdrive get serialnumber').toString();
          const lines = result.trim().split('\n').slice(1);
          for (const line of lines) {
            const serial = line.trim();
            if (serial && serial !== 'SerialNumber') {
              diskInfo.push(`disk:${serial}`);
            }
          }
        } catch (error) {
          console.warn('Could not retrieve disk serial on Windows:', error);
        }
        break;

      case 'darwin':
        // macOS - using system_profiler
        try {
          const result = execSync('system_profiler SPSerialATADataType').toString();
          const lines = result.split('\n');
          for (const line of lines) {
            if (line.includes('Serial Number:')) {
              const serial = line.split('Serial Number:')[1].trim();
              if (serial) {
                diskInfo.push(`disk:${serial}`);
              }
            }
          }
        } catch (error) {
          console.warn('Could not retrieve disk serial on macOS:', error);
        }
        break;

      case 'linux':
        // Linux - multiple methods to try
        try {
          // Method 1: Check for SCSI disk IDs
          if (fs.existsSync('/sys/block/sda/device/serial')) {
            const serial = fs.readFileSync('/sys/block/sda/device/serial', 'utf8').trim();
            if (serial) {
              diskInfo.push(`disk:${serial}`);
            }
          }

          // Method 2: Try to get from lsblk
          try {
            const result = execSync('lsblk -o SERIAL -n 2>/dev/null || true').toString();
            const serials = result.trim().split('\n').filter(s => s.trim());
            for (const serial of serials) {
              if (serial) {
                diskInfo.push(`disk:${serial}`);
              }
            }
          } catch (e) {
            // lsblk might not be available
          }

          // Method 3: Check disk by-id
          if (fs.existsSync('/dev/disk/by-id')) {
            const files = fs.readdirSync('/dev/disk/by-id');
            for (const file of files) {
              if (!file.includes('part') && (file.includes('wwn-') || file.includes('ata-'))) {
                diskInfo.push(`disk-id:${file}`);
              }
            }
          }
        } catch (error) {
          console.warn('Could not retrieve disk serial on Linux:', error);
        }
        break;

      default:
        console.warn(`Disk serial retrieval not implemented for platform: ${process.platform}`);
    }
  } catch (error) {
    console.warn('Failed to get disk info:', error);
  }

  return diskInfo;
}

/**
 * Enhanced machine fingerprint with disk information
 */
async function generateMachineFingerprintAsync(): Promise<string> {
  try {
    const components: string[] = [];

    // 1. CPU info (first CPU)
    const cpus = os.cpus();
    if (cpus.length > 0) {
      components.push(`cpu:${cpus[0].model}`);
    }

    // 2. Disk information (platform-specific)
    const diskInfo = await getDiskInfo();
    components.push(...diskInfo);

    // Combine all components and create a hash
    const combined = components.join('|');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');

    return hash;
  } catch (error) {
    console.error('Failed to generate machine fingerprint:', error);
    // Fallback: use basic system info
    const fallback = `${os.hostname()}|${os.platform()}|${os.arch()}|${os.release()}`;
    return crypto.createHash('sha256').update(fallback).digest('hex');
  }
}

/**
 * Generates a unique machine fingerprint (synchronous version)
 * For backward compatibility
 */
export function generateMachineFingerprint(): string {
  // Note: This will not include disk info in synchronous context
  // Use generateMachineFingerprintAsync() instead for full features
  try {
    const components: string[] = [];
    const arch = os.arch();
    components.push(arch);

    const cpus = os.cpus();
    if (cpus.length > 0) {
      components.push(cpus[0].model);
    }

    const networkInterfaces = os.networkInterfaces();
    const macAddresses: string[] = [];

    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        for (const iface of interfaces) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            macAddresses.push(iface.mac);
          }
        }
      }
    }

    macAddresses.sort();
    components.push(...macAddresses);

    const combined = components.join('|');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');

    return hash;
  } catch (error) {
    console.error('Failed to generate machine fingerprint:', error);
    const fallback = `${os.hostname()}-${os.platform()}-${os.arch()}`;
    return crypto.createHash('sha256').update(fallback).digest('hex');
  }
}

/**
 * Enhanced async version for getting machine fingerprint
 */
export async function getMachineFingerprintEnhanced(): Promise<string> {
  try {
    const fingerprint = await generateMachineFingerprintAsync();
    return fingerprint;
  } catch (error) {
    console.error('Enhanced fingerprint failed, falling back:', error);
    return generateMachineFingerprint();
  }
}

/**
 * Gets the current machine fingerprint
 * Caches the result for performance
 */
let cachedFingerprint: string | null = null;

export function getMachineFingerprint(): string {
  if (!cachedFingerprint) {
    cachedFingerprint = generateMachineFingerprint();
  }
  return cachedFingerprint;
}

/**
 * Resets the cached fingerprint (useful for testing)
 */
export function resetMachineFingerprintCache(): void {
  cachedFingerprint = null;
}

// Export the async version as default if needed
export default getMachineFingerprintEnhanced;