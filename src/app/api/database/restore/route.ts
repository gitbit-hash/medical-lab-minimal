import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    // TODO: Add proper authentication check (Super Admin only)

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
    }

    // Convert File to Buffer/Stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create readable stream from buffer
    const fileStream = new Readable();
    fileStream.push(buffer);
    fileStream.push(null);

    try {
        // Determine psql path (env var or default)
        // On Windows, 'psql' usually works if in PATH, otherwise full path needed
        const binDir = process.env.PG_BIN_DIR ? process.env.PG_BIN_DIR.replace(/\/$/, '') + '/' : '';
        const psqlExecutable = process.env.PSQL_PATH || 'psql';
        const cmd = binDir ? `"${binDir}${psqlExecutable}"` : psqlExecutable;

        // Spawn psql process
        // We explicitly use the -d flag with the connection string for clarity, or just passing it as generic arg
        // 'psql' accepts dsn as argument
        const psql = spawn(cmd, [databaseUrl], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: process.env,
            shell: true
        });

        // Promise wrapper for the process execution
        const restorePromise = new Promise((resolve, reject) => {
            let stderr = '';

            psql.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            psql.on('error', (err) => {
                reject(err);
            });

            psql.on('close', (code) => {
                if (code === 0) {
                    resolve('Success');
                } else {
                    reject(new Error(`psql exited with code ${code}. Error: ${stderr}`));
                }
            });
        });

        // Pipe the file data to psql's stdin
        if (psql.stdin) {
            fileStream.pipe(psql.stdin);
        } else {
            throw new Error('Could not open stdin for psql');
        }

        await restorePromise;

        return NextResponse.json({ success: true, message: 'Database restored successfully' });

    } catch (error: any) {
        console.error('Restore failed:', error);
        return NextResponse.json(
            { error: `Restore failed: ${error.message}` },
            { status: 500 }
        );
    }
}
