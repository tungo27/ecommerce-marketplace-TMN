declare module 'buffer-to-stream' {
  import type { Readable } from 'node:stream';

  function toStream(buffer: Uint8Array): Readable;
  export default toStream;
}
