import {StreamReader} from "../StreamReader";
import {Header} from "../Header";
import {IDescriptorInfoParser} from "./DescriptorInfoParser";

export class _enum implements IDescriptorInfoParser {

  offset:number;
  length:number;
  _type:string;
  _enum:string;


  constructor() {
  }

  parse(stream:StreamReader, length?:number, header?:Header) {
    var length:number;

    this.offset = stream.tell();

    // type
    length = stream.readUint32();
    if (length === 0) {
      length = 4;
    }
    this._type = stream.readString(length);

    // enum
    length = stream.readUint32();
    if (length === 0) {
      length = 4;
    }
    this._enum = stream.readString(length);

    this.length = stream.tell() - this.offset;
  }
}