import fs from 'node:fs';
import path from 'node:path';

const LOGGING_FLAG = Symbol.for('fems.fileLoggingInitialized');

function toText(chunk: unknown, encoding?: BufferEncoding): string {
  if (typeof chunk === 'string') {
    return chunk;
  }
  if (Buffer.isBuffer(chunk)) {
    return chunk.toString(encoding ?? 'utf8');
  }
  return String(chunk);
}

export function initializeFileLogging(serviceName: string): void {
  const globalState = globalThis as typeof globalThis & { [LOGGING_FLAG]?: boolean };
  if (globalState[LOGGING_FLAG]) {
    return;
  }

  const logsDir = path.join(process.cwd(), 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const safeName = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const logFile = path.join(logsDir, `${safeName}.log`);
  const stream = fs.createWriteStream(logFile, { flags: 'a' });

  const stdoutWrite = process.stdout.write.bind(process.stdout);
  const stderrWrite = process.stderr.write.bind(process.stderr);

  const writeWithMirror = (
    originalWrite: (...args: unknown[]) => boolean,
    level: 'stdout' | 'stderr',
  ) => {
    return (...args: unknown[]) => {
      const [chunk, secondArg] = args;
      const encoding = typeof secondArg === 'string' ? (secondArg as BufferEncoding) : undefined;
      const text = toText(chunk, encoding);
      const lines = text.split(/\r?\n/);
      const stamped = lines
        .filter((line) => line.length > 0)
        .map((line) => `[${new Date().toISOString()}] [${level}] ${line}`)
        .join('\n');

      if (stamped) {
        stream.write(`${stamped}\n`);
      }

      return originalWrite(...args);
    };
  };

  process.stdout.write = writeWithMirror(stdoutWrite, 'stdout') as typeof process.stdout.write;
  process.stderr.write = writeWithMirror(stderrWrite, 'stderr') as typeof process.stderr.write;
  globalState[LOGGING_FLAG] = true;
}
