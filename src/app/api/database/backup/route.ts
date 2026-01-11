import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // TODO: Add proper authentication check here (e.g. check for admin session)

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        return NextResponse.json(
            { error: 'DATABASE_URL environment variable is not set' },
            { status: 500 }
        );
    }

    // Parse the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `backup-medicalab-${date}.sql`;

    // Start pg_dump process
    // Start pg_dump process
    // Parse DATABASE_URL to get credentials
    // Connection string format: postgres://user:password@host:port/database
    let env = { ...process.env };

    try {
        const url = new URL(databaseUrl);
        env.PGHOST = url.hostname;
        env.PGPORT = url.port || '5432';
        env.PGUSER = url.username;
        env.PGPASSWORD = url.password;
        env.PGDATABASE = url.pathname.slice(1); // Remove leading slash
    } catch (e) {
        console.error('Failed to parse DATABASE_URL for backup', e);
        // If parsing fails, we fallback to just passing the URL, which might fail on password
    }

    // Use PG_BIN_DIR from env if available
    const binDir = process.env.PG_BIN_DIR ? process.env.PG_BIN_DIR.replace(/\/$/, '') + '/' : '';
    const pgDumpExecutable = process.env.PG_DUMP_PATH || 'pg_dump';

    // On Windows, simply quoting the path usually works best with shell: true 
    const cmd = binDir ? `"${binDir}${pgDumpExecutable}"` : pgDumpExecutable;

    const pgDump = spawn(cmd, [databaseUrl], {
        shell: true,
        env: env
    });

    // Create a TransformStream to pass data from the stdout to the response
    const stream = new ReadableStream({
        start(controller) {
            pgDump.stdout.on('data', (chunk) => {
                try {
                    controller.enqueue(chunk);
                } catch (e) {
                    console.warn('Error enqueuing data (client disconnected?):', e);
                    pgDump.kill();
                }
            });

            pgDump.stdout.on('end', () => {
                try {
                    controller.close();
                } catch (e) {
                    // Ignore if already closed
                }
            });

            pgDump.stderr.on('data', (data) => {
                const msg = data.toString();
                // Stdout usage might cause some logs to go to stderr without being errors
                console.log(`pg_dump log: ${msg}`);
            });

            pgDump.on('error', (err) => {
                console.error('Failed to start pg_dump process:', err);
                try {
                    controller.error(new Error('Failed to start backup process. Ensure PostgreSQL is installed and in PATH.'));
                } catch (e) { }
            });

            pgDump.on('close', (code) => {
                if (code !== 0) {
                    console.error(`pg_dump exited with code ${code}`);
                    try {
                        controller.error(new Error(`Backup process failed with code ${code}`));
                    } catch (e) { }
                }
            });
        },
        cancel() {
            pgDump.kill();
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': 'application/sql',
        },
    });
}
