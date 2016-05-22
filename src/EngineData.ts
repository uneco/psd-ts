//var iconv = require('iconv-lite')
// engineData is an array form descriptor.coffee

/////////////////////
interface IColor {
  Type : number;
  Values : Array<number>;
}


interface IParagraphProperties {
  AutoHyphenate: boolean;
  AutoLeading: number;
  Burasagari: boolean;
  ConsecutiveHyphens: number;
  EndIndent: number;
  EveryLineComposer: boolean;
  FirstLineIndent: number;
  GlyphSpacing: Array<number>
  Hanging: boolean;
  HyphenatedWordSize: number;
  Justification: number;
  KinsokuOrder: number;
  LeadingType: number;
  LetterSpacing: Array<number>
  PostHyphen: number;
  PreHyphen: number;
  SpaceAfter: number;
  SpaceBefore: number;
  StartIndent: number;
  WordSpacing: Array<number>
  Zone: number;
}

interface IFont {
  FontType: number;
  Name: string;
  Script: number;
  Synthetic: number;
}

interface IParagraphSheet {
  DefaultStyleSheet : number;
  Name : string;
  Properties : IParagraphProperties;
}

interface IStyleSheetData {
  AutoKerning: boolean;
  AutoLeading: boolean;
  BaselineDirection: number;
  BaselineShift: number;
  DLigatures: boolean;
  FauxBold: boolean;
  FauxItalic: boolean;
  FillColor: IColor;
  FillFirst: boolean;
  FillFlag: boolean;
  Font: number;
  FontBaseline: number;
  FontCaps: number;
  FontSize: number;
  HorizontalScale: number;
  Kerning: number;
  Language: number;
  Leading: number;
  Ligatures: boolean;
  NoBreak: boolean;
  OutlineWidth: number;
  Strikethrough: boolean;
  StrokeColor: IColor;
  StrokeFlag: boolean;
  StyleRunAlignment: number;
  Tracking: number;
  Tsume: number;
  Underline: boolean;
  VerticalScale: number;
  YUnderline: number;
}

interface IStyleSheet {
  Name : string;
  StyleSheetData : IStyleSheetData;
}

interface IEditor {
  Text : string;
}

interface IGridInfo {
  AlignLineHeightToGridFlags: boolean;
  GridColor: IColor;
  GridIsOn: boolean;
  GridLeading: number;
  GridLeadingFillColor: IColor;
  GridSize: number;
  ShowGrid: boolean;
}

interface IAdjustments {
  Axis: Array<number>;
  XY: Array<number>
}

//paragraph runs
interface IParagraphRunData {
  Adjustments: IAdjustments;
  ParagraphSheet: IParagraphSheet;
}

interface IParagraphRun {
  DefaultRunData : IParagraphRunData;
  RunArray : Array<IParagraphRunData>;
  RunLengthArray : Array<number>
}

//style runs
interface IStyleRunData {
  StyleSheet : IStyleSheet;
}

interface IStyleRun {
  DefaultRunData : IStyleRunData;
  RunArray : Array<IStyleRunData>;
  RunLengthArray : Array<number>
  IsJoinable : boolean;
}

//rendered

interface IShape {
  Cookie : {
    Photoshop : {
      Base : {
        ShapeType : number;
        TransformPoint0 : Array<number>;
        TransformPoint1 : Array<number>;
        TransformPoint2 : Array<number>;
      },
      BoxBounds?:Array<number>;
      PointBase?:Array<number>;
    }
  };
  Lines : {
    Children : Array<string>;
    WritingDirection:number;
  };
  Procession : number;
  ShapeType : number;
}

interface IShapes {
  Children : Array<IShape>
  WritingDirection : number;
}

interface IRendered {
  Shapes : IShapes;
  Version : number;
}

//top level

export interface IEngineData {
  DocumentResources:{
    FontSet:Array<IFont>;
    ParagraphSheetSet:Array<IParagraphSheet>;
    StyleSheetSet: Array<IStyleSheet>
    KinsokuSet:Array<any>;
    MojiKumiSet:Array<any>
    SmallCapSize:number;
    SubscriptPosition: number;
    SubscriptSize: number;
    SuperscriptPosition: number;
    SuperscriptSize: number;
    TheNormalParagraphSheet: number;
    TheNormalStyleSheet: number;
  }
  EngineDict:{
    AntiAlias: number;
    Editor:IEditor;
    GridInfo:IGridInfo;
    ParagraphRun:IParagraphRun;
    Rendered:IRendered;
    StyleRun:IStyleRun;
    UseFractionalGlyphWidths: boolean;
  }
  ResourceDict:{
    FontSet:Array<IFont>;
    ParagraphSheetSet:Array<IParagraphSheet>;
    StyleSheetSet: Array<IStyleSheet>
    KinsokuSet:Array<any>;
    MojiKumiSet:Array<any>
    SmallCapSize:number;
    SubscriptPosition: number;
    SubscriptSize: number;
    SuperscriptPosition: number;
    SuperscriptSize: number;
    TheNormalParagraphSheet: number;
    TheNormalStyleSheet: number;
  }
}
////////////////////////////////

// helper fun
function Match(reg:RegExp, text:string){
  return reg.test(text);
}
function isArray(o:any){
  return Object.prototype.toString.call(o) === '[object Array]';
}

function decodeUtf16(w:Array<number>) {

  //TODO: Remove BOM - interpret bom correctly
  var w16:Array<number> = [];
  for(var i = 0; i < w.length;i+=2) {
    w16.push((0x00FF|(w[i]<<8))&(0xFF00|w[i+1]));
  }
  w16.splice(0,1);
  w = w16;

  var i = 0;
  var len = w.length;
  var w1:number, w2:number;
  var charCodes:Array<number> = [];
  while (i < len) {
    var w1 = w[i++];
    if ((w1 & 0xF800) !== 0xD800) { // w1 < 0xD800 || w1 > 0xDFFF
      charCodes.push(w1);
      continue;
    }
    if ((w1 & 0xFC00) === 0xD800) { // w1 >= 0xD800 && w1 <= 0xDBFF
      throw new RangeError('Invalid octet 0x' + w1.toString(16) + ' at offset ' + (i - 1));
    }
    if (i === len) {
      throw new RangeError('Expected additional octet');
    }
    w2 = w[i++];
    if ((w2 & 0xFC00) !== 0xDC00) { // w2 < 0xDC00 || w2 > 0xDFFF)
      throw new RangeError('Invalid octet 0x' + w2.toString(16) + ' at offset ' + (i - 1));
    }
    charCodes.push(((w1 & 0x3ff) << 10) + (w2 & 0x3ff) + 0x10000);
  }
  return String.fromCharCode.apply(String, charCodes);
}

type Matcher = (text:string)=>{match:boolean;parse:()=>any};

export class EngineData {

  nodeStack : Array<any>;
  propertyStack : Array<any>;
  currentNode : {[key:string]:any};

  MATCH_TYPE : {[key:string]:Matcher};

  constructor() {
    this.MATCH_TYPE = {
      "hashStart": this.hashStart,
      "hashEnd": this.hashEnd,
      "multiLineArrayStart": this.multiLineArrayStart,
      "multiLineArrayEnd": this.multiLineArrayEnd,
      "property": this.property,
      "propertyWithData": this.propertyWithData,
      "singleLineArray": this.singleLineArray,
      "boolean": this.boolean,
      "number": this.number,
      "numberWithDecimal": this.numberWithDecimal,
      "string": this.string
    };
  }

  parse(engineData:Array<number>) {
    this.nodeStack = [];
    this.propertyStack = [];
    this.currentNode = {};
    this.textReg(EngineData.textSegment(EngineData.codeToString(engineData)));
    return this.currentNode["undefined"] as IEngineData;
  }


  static codeToString(engineData:Array<number>){
    return String.fromCharCode.apply(null, engineData);
  }


  static textSegment(text:string){
    return text.split('\n');
  }

  textReg(textArr:Array<string>) {
    textArr.map((currentText)=>{
      this.typeMatch(currentText.replace(/^\t+/g, ''));
    });
  }

  typeMatch(currentText:string){
      for (var currentType in this.MATCH_TYPE) {
        if(this.MATCH_TYPE.hasOwnProperty(currentType)) {
          var t = this.MATCH_TYPE[currentType].apply(this,[currentText]);
          if (t.match){
              return t.parse();
          }
        }
      }
      return currentText;
  }

  // node handle
  stackPush(node:Array<any>|{}){
    this.nodeStack.push(this.currentNode);
    this.currentNode = node;
  }

  updateNode(){
    var node = this.nodeStack.pop();
    if (isArray(node)){
      node.push(this.currentNode);
    } else {
      node[this.propertyStack.pop()] = this.currentNode;
    }
    this.currentNode = node;
  }

  pushKeyValue(key:string,value:any){
    this.currentNode[key] = value;
  }

  // tyep reg
  hashStart(text:string) {
    var reg = /^<<$/;

    return {
      match: Match(reg, text),
      parse: ()=>{
        this.stackPush({});
      }
    }
  }

  hashEnd(text:string) {
    var reg = /^>>$/;

    return {
      match: Match(reg, text),
      parse: ()=>{
        this.updateNode();
      }
    }
  }

  multiLineArrayStart(text:string) {
    var reg = /^\/(\w+) \[$/;

    return {
      match: Match(reg, text),
      parse: ()=>{
        this.propertyStack.push(text.match(reg)[1]);
        this.stackPush([]);
      }
    }
  }

  multiLineArrayEnd(text:string) {
    var reg = /^\]$/;

    return {
      match: Match(reg, text),
      parse: ()=>{
        this.updateNode();
      }
    }
  }

  property(text:string) {
    var reg = /^\/([A-Z0-9]+)$/i;

    return {
      match: Match(reg, text),
      parse: ()=>{
        this.propertyStack.push(text.match(reg)[1]);
      }
    }
  }

  propertyWithData(text:string) {
    var reg = /^\/([A-Z0-9]+)\s((.|\r)*)$/i;

    return {
      match: Match(reg, text),
      parse: ()=>{
        var match = text.match(reg);
        this.pushKeyValue(match[1], this.typeMatch(match[2]));
      }
    }
  }

  // value reg
  boolean(text:string) {
    var reg = /^(true|false)$/;
    return {
      match: Match(reg, text),
      parse: ()=>{
        return text === 'true' ? true : false;
      }
    }
  }

  number(text:string) {
    var reg = /^-?\d+$/;
    return {
      match: Match(reg, text),
      parse: ()=> {
        return Number(text);
      }
    }
  }

  numberWithDecimal(text:string) {
    var reg = /^(-?\d*)\.(\d+)$/;
    return {
      match: Match(reg, text),
      parse: ()=> {
        return Number(text);
      }
    }
  }

  singleLineArray(text:string) {
    //Case it seems that only a single line array of digital array
    var reg = /^\[(.*)\]$/;
    return {
      match: Match(reg, text),
      parse: ()=> {
        var items = text.match(reg)[1].trim().split(' ');
        var tempArr:Array<any> = [];
        for (var i = 0, l = items.length; i < l; i++) {
          tempArr.push(this.typeMatch(items[i]));
        }
        return tempArr;
      }
    }
  }

  string(text:string) {
    //the text in editor has some encoding issues
    var reg = /^\(((.|\r)*)\)$/;
    return {
      match: Match(reg, text),
      parse: ()=> {
        var txt = text.match(reg)[1];
        var bf:Array<any> = [];
        for (var i = 0, l = txt.length; i < l; i++) {
          bf.push(txt.charCodeAt(i));
        }
        //return iconv.decode(new Buffer(bf), 'utf-16');//it`s utf-16 with bom
        return decodeUtf16(bf);
      }
    }
  }



}
