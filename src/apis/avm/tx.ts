/**
 * @packageDocumentation
 * @module AVMAPI-Transactions
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import createHash from "create-hash";
import { AVMConstants, InitialStates, Signature, SigIdx } from './types';
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { TransferableOperation } from './ops';
import { Credential, SelectCredentialClass } from './credentials';
import { AVMKeyChain, AVMKeyPair } from './keychain';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[BaseTx]] instance.
 * 
 * @param txtype The id of the transaction type 
 * 
 * @returns An instance of an [[BaseTx]]-extended class.
 */
export const SelectTxClass = (txtype:number, ...args:Array<any>):BaseTx => {
    if(txtype == AVMConstants.BASETX){
        let tx:BaseTx = new BaseTx(...args);
        return tx;
    } else if(txtype == AVMConstants.CREATEASSETTX){
        let tx:CreateAssetTx = new CreateAssetTx(...args);
        return tx;
    } else if(txtype == AVMConstants.OPERATIONTX){
        let tx:OperationTx = new OperationTx(...args);
        return tx;
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectTxClass: unknown txtype " + txtype);
}

/** 
 * Class representing a base for all transactions.
 */
export class BaseTx {
    protected networkid:Buffer = Buffer.alloc(4);
    protected blockchainid:Buffer = Buffer.alloc(32);
    protected numouts:Buffer = Buffer.alloc(4);
    protected outs:Array<TransferableOutput>;
    protected numins:Buffer = Buffer.alloc(4);
    protected ins:Array<TransferableInput>;

    /**
     * Returns the id of the [[BaseTx]]
     */
    getTxType():number {
        return AVMConstants.BASETX;
    }

    /**
     * Returns the NetworkID as a number
     */
    getNetworkID = ():number => {
        return this.networkid.readUInt32BE(0);
    }

    /**
     * Returns the Buffer representation of the BlockchainID
     */
    getBlockchainID = ():Buffer => {
        return this.blockchainid;
    }
    
    /**
     * Returns the array of [[TransferableInput]]s
     */
    getIns = ():Array<TransferableInput> => {
        return this.ins;
    }

    /**
     * Returns the array of [[TransferableOutput]]s
     */
    getOuts = ():Array<TransferableOutput> => {
        return this.outs;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
     * 
     * @returns The length of the raw [[BaseTx]]
     * 
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.networkid = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.blockchainid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let outcount:number = this.numouts.readUInt32BE(0);
        this.outs = [];
        for(let i = 0; i < outcount; i++){
            let xferout:TransferableOutput = new TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.outs.push(xferout);
        }

        this.numins = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let incount:number = this.numins.readUInt32BE(0);
        this.ins = [];
        for(let i = 0; i < incount; i++){
            let xferin:TransferableInput = new TransferableInput();
            offset = xferin.fromBuffer(bytes, offset);
            this.ins.push(xferin);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[BaseTx]].
     */
    toBuffer():Buffer {
        this.outs.sort(TransferableOutput.comparator());
        this.ins.sort(TransferableInput.comparator());
        this.numouts.writeUInt32BE(this.outs.length, 0);
        this.numins.writeUInt32BE(this.ins.length, 0);
        let bsize:number = this.networkid.length + this.blockchainid.length + this.numouts.length;
        let barr:Array<Buffer> = [this.networkid, this.blockchainid, this.numouts];
        for(let i = 0; i < this.outs.length; i++) {
            let b:Buffer = this.outs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        barr.push(this.numins);
        bsize += this.numins.length;
        for(let i = 0; i < this.ins.length; i++) {
            let b:Buffer = this.ins[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        let buff:Buffer = Buffer.concat(barr, bsize);
        return buff;
    }

    /**
     * Returns a base-58 representation of the [[BaseTx]].
     */
    toString():string {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     * 
     * @param msg A Buffer for the [[UnsignedTx]] 
     * @param kc An [[AVMKeyChain]] used in signing
     * 
     * @returns An array of [[Credential]]s
     */
    sign(msg:Buffer, kc:AVMKeyChain):Array<Credential> {
        let sigs:Array<Credential> = [];
        for(let i = 0; i < this.ins.length; i++) {
            let cred:Credential = SelectCredentialClass(this.ins[i].getInput().getCredentialID());
            let sigidxs:Array<SigIdx> = this.ins[i].getInput().getSigIdxs();
            for(let j = 0; j < sigidxs.length; j++) {
                let keypair:AVMKeyPair = kc.getKey(sigidxs[j].getSource());
                let signval:Buffer = keypair.sign(msg);
                let sig:Signature = new Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            sigs.push(cred);
        }
        return sigs;
    }

    /**
     * Class representing a BaseTx which is the foundation for all transactions.
     * 
     * @param networkid Optional networkid, default 3
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     */
    constructor(networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16), outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined) {
        this.networkid.writeUInt32BE(networkid, 0);
        this.blockchainid = blockchainid;
        if(typeof ins !== 'undefined' && typeof outs !== 'undefined'){
            this.numouts.writeUInt32BE(outs.length, 0);
            this.outs = outs.sort(TransferableOutput.comparator());
            this.numins.writeUInt32BE(ins.length, 0);
            this.ins = ins.sort(TransferableInput.comparator());
        }
    }
}

export class CreateAssetTx extends BaseTx {
    protected name:string = "";
    protected symbol:string = "";
    protected denomination:Buffer = Buffer.alloc(1);
    protected initialstate:InitialStates = new InitialStates();

    /**
     * Returns the id of the [[CreateAssetTx]]
     */
    getTxType():number {
        return AVMConstants.CREATEASSETTX;
    }

    /**
     * Returns the array of array of [[Output]]s for the initial state
     */
    getInitialStates = ():InitialStates => {
        return this.initialstate;
    }

    /**
     * Returns the string representation of the name
     */
    getName = ():string => {
        return this.name;
    }


    /**
     * Returns the string representation of the symbol
     */
    getSymbol = ():string => {
        return this.symbol;
    }



    /**
     * Returns the numeric representation of the denomination
     */
    getDenomination = ():number => {
        return this.denomination.readUInt8(0);
    }


    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the denomination
     */
    getDenominationBuffer = ():Buffer => {
        return this.denomination;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAssetTx]], parses it, populates the class, and returns the length of the [[CreateAssetTx]] in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAssetTx]]
     * 
     * @returns The length of the raw [[CreateAssetTx]]
     * 
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);

        let namesize:number = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        this.name = bintools.copyFrom(bytes, offset, offset + namesize).toString("utf8");
        offset += namesize;

        let symsize:number = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        this.symbol = bintools.copyFrom(bytes, offset, offset + symsize).toString("utf8");
        offset += symsize;

        this.denomination = bintools.copyFrom(bytes, offset, offset + 1);
        offset += 1;

        let inits:InitialStates = new InitialStates();
        offset = inits.fromBuffer(bytes, offset);
        this.initialstate = inits;

        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
     */
    toBuffer():Buffer {
        let superbuff:Buffer = super.toBuffer();
        let initstatebuff:Buffer = this.initialstate.toBuffer();

        let namebuff:Buffer = Buffer.alloc(this.name.length);
        namebuff.write(this.name, 0, this.name.length, "utf8");
        let namesize:Buffer = Buffer.alloc(2);
        namesize.writeUInt16BE(this.name.length, 0);

        let symbuff:Buffer = Buffer.alloc(this.symbol.length);
        symbuff.write(this.symbol, 0, this.symbol.length, "utf8");
        let symsize:Buffer  = Buffer.alloc(2);
        symsize.writeUInt16BE(this.symbol.length, 0);

        let bsize:number = superbuff.length + namesize.length + namebuff.length + symsize.length + symbuff.length + this.denomination.length + initstatebuff.length;
        let barr:Array<Buffer> = [superbuff, namesize, namebuff, symsize, symbuff, this.denomination, initstatebuff];
        return Buffer.concat(barr, bsize);
    }
    
    /**
     * Class representing an unsigned Create Asset transaction.
     * 
     * @param networkid Optional networkid, default 3
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVA = 10^9 $nAVA
     * @param initialstate Optional [[InitialStates]] that represent the intial state of a created asset
     */
    constructor(
            networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16), 
            outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined, 
            name:string = undefined, symbol:string = undefined, denomination:number = undefined, 
            initialstate:InitialStates = undefined
        ) {
        super(networkid, blockchainid, outs, ins);
        if(
            typeof name === 'string' && typeof symbol === 'string' && typeof denomination === 'number' && 
            denomination >= 0 && denomination <= 32 && typeof initialstate !== 'undefined'
        ) {
            this.initialstate = initialstate;
            this.name = name;
            this.symbol = symbol;
            this.denomination.writeUInt8(denomination, 0);
        }
    }
}

/**
 * Class representing an unsigned Operation transaction.
 */
export class OperationTx extends BaseTx {
    protected numOps:Buffer = Buffer.alloc(4);
    protected ops:Array<TransferableOperation> = [];
    
    /**
     * Returns the id of the [[OperationTx]]
     */
    getTxType():number {
        return AVMConstants.OPERATIONTX;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[OperationTx]], parses it, populates the class, and returns the length of the [[OperationTx]] in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[OperationTx]]
     * 
     * @returns The length of the raw [[OperationTx]]
     * 
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        this.numOps = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let numOps:number = this.numOps.readUInt32BE(0);
        for(let i:number = 0; i < numOps; i++) {
            let op:TransferableOperation = new TransferableOperation();
            offset = op.fromBuffer(bytes, offset);
            this.ops.push(op);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[OperationTx]].
     */
    toBuffer():Buffer {
        this.numOps.writeUInt32BE(this.ops.length, 0);
        let barr:Array<Buffer> = [super.toBuffer(), this.numOps];
        for(let i = 0; i < this.ops.length; i++) {
            barr.push(this.ops[i].toBuffer());
        }
        return Buffer.concat(barr);
    }

    /**
     * Returns an array of [[Operation]]s in this transaction.
     */
    getOperations():Array<TransferableOperation> {
        return this.ops;
    }

    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     * 
     * @param msg A Buffer for the [[UnsignedTx]] 
     * @param kc An [[AVMKeyChain]] used in signing
     * 
     * @returns An array of [[Credential]]s
     */
    sign(msg:Buffer, kc:AVMKeyChain):Array<Credential> {
        let sigs:Array<Credential> = super.sign(msg, kc);
        for(let i = 0; i < this.ops.length; i++) {
            let cred:Credential = SelectCredentialClass(this.ops[i].getOperation().getCredentialID());
            let sigidxs:Array<SigIdx> = this.ops[i].getOperation().getSigIdxs();
            for(let j = 0; j < sigidxs.length; j++) {
                let keypair:AVMKeyPair = kc.getKey(sigidxs[j].getSource());
                let signval:Buffer = keypair.sign(msg);
                let sig:Signature = new Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            sigs.push(cred);
        }
        return sigs;
    }

    /**
     * Class representing an unsigned Operation transaction.
     * 
     * @param networkid Optional networkid, default 3
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param ops Array of [[Operation]]s used in the transaction
     */
    constructor(
        networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16),
        outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined, 
        ops:Array<TransferableOperation> = undefined
        ) {
        super(networkid, blockchainid, outs, ins );
        if(typeof ops !== 'undefined' && Array.isArray(ops)) {
            for(let i = 0; i < ops.length; i++) {
                if(!(ops[i] instanceof TransferableOperation)) {
                    throw new Error("Error - OperationTx.constructor: invalid op in array parameter 'ops'")
                }
            }
            this.ops = ops;
        }
    }
}

/**
 * Class representing an unsigned Import transaction.
 */
export class ImportTx extends BaseTx {
    protected numImportOuts:Buffer = Buffer.alloc(4);
    protected importIns:Array<TransferableInput> = [];
    /**
     * Returns the id of the [[ImportTx]]
     */
    getTxType():number {
        return AVMConstants.IMPORTTX;
    }

    /**
     * Returns an array of [[TransferableInput]]s in this transaction.
     */
    getImportIns():Array<TransferableInput> {
        return this.importIns;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ImportTx]], parses it, populates the class, and returns the length of the [[ImportTx]] in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ImportTx]]
     * 
     * @returns The length of the raw [[ImportTx]]
     * 
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        this.numImportOuts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let numImportOuts:number = this.numImportOuts.readUInt32BE(0);
        for(let i:number = 0; i < numImportOuts; i++) {
            let importIn:TransferableInput = new TransferableInput();
            offset = importIn.fromBuffer(bytes, offset);
            this.importIns.push(importIn);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
     */
    toBuffer():Buffer {
        this.numImportOuts.writeUInt32BE(this.importIns.length, 0);
        let barr:Array<Buffer> = [super.toBuffer(), this.numImportOuts];
        for(let i = 0; i < this.importIns.length; i++) {
            barr.push(this.importIns[i].toBuffer());
        }
        return Buffer.concat(barr);
    }


    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     * 
     * @param msg A Buffer for the [[UnsignedTx]] 
     * @param kc An [[AVMKeyChain]] used in signing
     * 
     * @returns An array of [[Credential]]s
     */
    sign(msg:Buffer, kc:AVMKeyChain):Array<Credential> {
        let sigs:Array<Credential> = super.sign(msg, kc);
        for(let i:number = 0; i < this.importIns.length; i++) {
            let cred:Credential = SelectCredentialClass(this.importIns[i].getInput().getCredentialID());
            let sigidxs:Array<SigIdx> = this.importIns[i].getInput().getSigIdxs();
            for(let j:number = 0; j < sigidxs.length; j++) {
                let keypair:AVMKeyPair = kc.getKey(sigidxs[j].getSource());
                let signval:Buffer = keypair.sign(msg);
                let sig:Signature = new Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            sigs.push(cred);
        }
        return sigs;
    }

    /**
     * Class representing an unsigned Import transaction.
     * 
     * @param networkid Optional networkid, default 3
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param importIns Optional array of the [[TransferableInput]]s
     */
    constructor(
        networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16),
        outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined,
        importIns:Array<TransferableInput> = undefined
        ) {
        super(networkid, blockchainid, outs, ins);
        if(typeof importIns !== 'undefined' && Array.isArray(importIns)) {
            for(let i = 0; i < importIns.length; i++) {
                if(!(importIns[i] instanceof TransferableInput)) {
                    throw new Error("Error - ImportTx.constructor: invalid out in array parameter 'importIns'")
                }
            }
            this.importIns = importIns;
        }
    }
}

/**
 * Class representing an unsigned Export transaction.
 */
export class ExportTx extends BaseTx {
    protected numExportOuts:Buffer = Buffer.alloc(4);
    protected exportOuts:Array<TransferableOutput> = [];
    /**
     * Returns the id of the [[ExportTx]]
     */
    getTxType():number {
        return AVMConstants.EXPORTTX;
    }

    /**
     * Returns an array of [[TransferableOutput]]s in this transaction.
     */
    getExportOuts():Array<TransferableOutput> {
        return this.exportOuts;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ExportTx]], parses it, populates the class, and returns the length of the [[ExportTx]] in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ExportTx]]
     * 
     * @returns The length of the raw [[ExportTx]]
     * 
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        this.numExportOuts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let numExportOuts:number = this.numExportOuts.readUInt32BE(0);
        for(let i:number = 0; i < numExportOuts; i++) {
            let exportOut:TransferableOutput = new TransferableOutput();
            offset = exportOut.fromBuffer(bytes, offset);
            this.exportOuts.push(exportOut);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
     */
    toBuffer():Buffer {
        this.numExportOuts.writeUInt32BE(this.exportOuts.length, 0);
        let barr:Array<Buffer> = [super.toBuffer(), this.numExportOuts];
        for(let i = 0; i < this.exportOuts.length; i++) {
            barr.push(this.exportOuts[i].toBuffer());
        }
        return Buffer.concat(barr);
    }

    /**
     * Class representing an unsigned Export transaction.
     * 
     * @param networkid Optional networkid, default 3
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param exportOuts Optional array of the [[TransferableOutput]]s
     */
    constructor(
        networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16),
        outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined,
        exportOuts:Array<TransferableOutput> = undefined
        ) {
        super(networkid, blockchainid, outs, ins);
        if(typeof exportOuts !== 'undefined' && Array.isArray(exportOuts)) {
            for(let i = 0; i < exportOuts.length; i++) {
                if(!(exportOuts[i] instanceof TransferableOutput)) {
                    throw new Error("Error - ExportTx.constructor: invalid out in array parameter 'exportOuts'")
                }
            }
            this.exportOuts = exportOuts;
        }
    }
}

/**
 * Class representing an unsigned transaction.
 */
export class UnsignedTx {
    protected transaction:BaseTx;

    getTransaction = ():BaseTx => {
        return this.transaction;
    }

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        let txtype:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.transaction = SelectTxClass(txtype);
        return this.transaction.fromBuffer(bytes, offset);
    }

    toBuffer():Buffer {
        let txtype:Buffer = Buffer.alloc(4);
        txtype.writeUInt32BE(this.transaction.getTxType(), 0);
        let basebuff = this.transaction.toBuffer();
        return Buffer.concat([txtype, basebuff], txtype.length + basebuff.length);
    }

    /**
     * Signs this [[UnsignedTx]] and returns signed [[Tx]]
     * 
     * @param kc An [[AVMKeyChain]] used in signing
     * 
     * @returns A signed [[Tx]]
     */
    sign(kc:AVMKeyChain):Tx {
        let txbuff = this.toBuffer();
        let msg:Buffer = Buffer.from(createHash('sha256').update(txbuff).digest()); 
        let sigs:Array<Credential> = this.transaction.sign(msg, kc);
        return new Tx(this, sigs);
    }

    constructor(transaction:BaseTx = undefined) {
        this.transaction = transaction;
    }
}

/**
 * Class representing a signed transaction.
 */
export class Tx {
    protected unsignedTx:UnsignedTx = new UnsignedTx();
    protected credentials:Array<Credential> = [];

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Tx]]
     * @param offset A number representing the starting point of the bytes to begin parsing
     * 
     * @returns The length of the raw [[Tx]]
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.unsignedTx = new UnsignedTx();
        offset = this.unsignedTx.fromBuffer(bytes, offset);
        let numcreds:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.credentials = [];
        for(let i = 0; i < numcreds; i++) {
            let credid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
            offset += 4;
            let cred:Credential = SelectCredentialClass(credid);
            offset = cred.fromBuffer(bytes, offset);
            this.credentials.push(cred);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Tx]].
     */
    toBuffer():Buffer {
        let txbuff:Buffer = this.unsignedTx.toBuffer();
        let bsize:number = txbuff.length;
        let credlen:Buffer = Buffer.alloc(4);
        credlen.writeUInt32BE(this.credentials.length, 0);
        let barr:Array<Buffer> = [txbuff, credlen];
        bsize += credlen.length;
        for(let i = 0; i < this.credentials.length; i++) {
            let credid:Buffer = Buffer.alloc(4);
            credid.writeUInt32BE(this.credentials[i].getCredentialID(), 0);
            barr.push(credid);
            bsize += credid.length;
            let credbuff:Buffer = this.credentials[i].toBuffer();
            bsize += credbuff.length;
            barr.push(credbuff)
        }
        let buff:Buffer = Buffer.concat(barr, bsize);
        return buff;
    }

    /**
     * Takes a base-58 string containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
     * 
     * @param serialized A base-58 string containing a raw [[Tx]]
     * 
     * @returns The length of the raw [[Tx]]
     * 
     * @remarks 
     * unlike most fromStrings, it expects the string to be serialized in AVA format
     */
    fromString(serialized:string):number {
        return this.fromBuffer(bintools.avaDeserialize(serialized));
    }

    /**
     * Returns a base-58 AVA-serialized representation of the [[Tx]].
     * 
     * @remarks 
     * unlike most toStrings, this returns in AVA serialization format
     */
    toString():string {
        return bintools.avaSerialize(this.toBuffer());
    }

    /**
     * Class representing a signed transaction.
     * 
     * @param unsignedTx Optional [[UnsignedTx]]
     * @param signatures Optional array of [[Credential]]s
     */
    constructor(unsignedTx:UnsignedTx = undefined, credentials:Array<Credential> = undefined) {
        if(typeof unsignedTx !== 'undefined'){
            this.unsignedTx = unsignedTx;
            if(typeof credentials !== 'undefined'){
                this.credentials = credentials
            }
        }
    }
}

