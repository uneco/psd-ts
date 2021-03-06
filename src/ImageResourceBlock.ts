import {StreamReader} from "./StreamReader";
import {StreamWriter} from "./StreamWriter";

export class ImageResourceBlock {

  offset:number;
  length:number;
  identifier:number;
  name:string;
  dataSize:number;
  data:Array<number>|Uint8Array;

  constructor() {
  }

  parse(stream:StreamReader) {
    this.offset = stream.tell();

    if (stream.readString(4) !== '8BIM') {
      throw new Error('invalid signature');
    }

    this.identifier = stream.readUint16();
    this.name = stream.readPascalString();
    this.dataSize = stream.readUint32();
    this.data = stream.read(this.dataSize);

    this.length = stream.tell() - this.offset;
  }
  
  write(stream:StreamWriter) {
    stream.writeString("8BIM");
    stream.writeUint16(this.identifier);
    stream.writePascalString(this.name);
    stream.writeUint32(this.data.length);
    stream.write(this.data);
  }
}

