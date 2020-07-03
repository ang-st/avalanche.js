/**
 * @packageDocumentation
 * @module PlatformAPI-Transactions
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import { PlatformConstants } from './types';
import { PlatformKeyChain } from "./keychain";
// import { Credential, SelectCredentialClass } from './credentials';
// import { AVMKeyChain, AVMKeyPair } from './keychain';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[AddDefaultSubnetDelegatorTx]] instance.
 * 
 * @param txtype The id of the transaction type 
 * 
 * @returns An instance of an [[AddDefaultSubnetDelegatorTx]]-extended class.
 */
export const SelectTxClass = (txtype:number, ...args:Array<any>):AddDefaultSubnetDelegatorTx => {
    if(txtype == PlatformConstants.ADDDEFAULTSUBNETDELEGATORTX){
        let tx:AddDefaultSubnetDelegatorTx = new AddDefaultSubnetDelegatorTx(...args);
        return tx;
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectTxClass: unknown txtype " + txtype);
}

/** 
 * Class representing an add default subnet delegator transaction.
 */
export class AddDefaultSubnetDelegatorTx {
    protected nodeid:Buffer = Buffer.alloc(32);
    protected weight:Buffer = Buffer.alloc(8);
    protected startTime:Buffer = Buffer.alloc(8);
    protected endTime:Buffer = Buffer.alloc(8);
    protected networkid:Buffer = Buffer.alloc(4);
    protected nonce:Buffer = Buffer.alloc(8);
    protected destination:Buffer = Buffer.alloc(32);

    /**
     * Returns the id of the [[AddDefaultSubnetDelegatorTx]]
     */
    getTxType():number {
        return PlatformConstants.ADDDEFAULTSUBNETDELEGATORTX;
    }

    /**
     * Returns the Buffer representation of the NodeID
     */
    getNodeID = ():Buffer => {
        return this.nodeid;
    }

    /**
     * Returns the Weight as a number
     */
    getWeight = ():number => {
        return this.weight.readUInt32BE(0);
    }

    /**
     * Returns the StartTime as a number
     */
    getStartTime = ():number => {
        return this.startTime.readUInt32BE(0);
    }

    /**
     * Returns the EndTime as a number
     */
    getEndTime = ():number => {
        return this.endTime.readUInt32BE(0);
    }

    /**
     * Returns the NetworkID as a number
     */
    getNetworkID = ():number => {
        return this.networkid.readUInt32BE(0);
    }

    /**
     * Returns the Nonce as a number
     */
    getNonce = ():number => {
        return this.nonce.readUInt32BE(0);
    }

    /**
     * Returns the Buffer representation of the Destination
     */
    getDestination = ():Buffer => {
        return this.destination;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[AddDefaultSubnetDelegatorTx]], parses it, populates the class, and returns the length of the AddDefaultSubnetDelegatorTx in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[AddDefaultSubnetDelegatorTx]]
     * 
     * @returns The length of the raw [[AddDefaultSubnetDelegatorTx]]
     * 
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.nodeid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.weight = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.startTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.endTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.networkid = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.nonce = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.destination = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddDefaultSubnetDelegatorTx]].
     */
    toBuffer():Buffer {
        let bsize:number = this.nodeid.length + this.weight.length + this.startTime.length + this.endTime.length + this.networkid.length + this.nonce.length + this.destination.length;
        let barr:Array<Buffer> = [this.nodeid, this.weight, this.startTime, this.endTime, this.networkid, this.nonce, this.destination];
        let buff:Buffer = Buffer.concat(barr, bsize);
        return buff;
    }

    /**
     * Returns a base-58 representation of the [[AddDefaultSubnetDelegatorTx]].
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
//     sign(msg:Buffer, kc:AVMKeyChain):Array<Credential> {
//         let sigs:Array<Credential> = [];
//         for(let i = 0; i < this.ins.length; i++) {
//             let cred:Credential = SelectCredentialClass(this.ins[i].getInput().getCredentialID());
//             let sigidxs:Array<SigIdx> = this.ins[i].getInput().getSigIdxs();
//             for(let j = 0; j < sigidxs.length; j++) {
//                 let keypair:AVMKeyPair = kc.getKey(sigidxs[j].getSource());
//                 let signval:Buffer = keypair.sign(msg);
//                 let sig:Signature = new Signature();
//                 sig.fromBuffer(signval);
//                 cred.addSignature(sig);
//             }
//             sigs.push(cred);
//         }
//         return sigs;
//     }

    /**
     * Class representing an AddDefaultSubnetDelegatorTx.
     * 
     * @param nodeid the node ID of the delegatee.
     * @param weight the amount of nAVAX the delegator is staking. 
     * @param startTime the Unix time when the delegator starts delegating.
     * @param endTime the Unix time when the delegator stops delegating (and staked AVAX is returned).
     * @param networkid the network id.
     * @param nonce the next unused nonce of the account that will provide the staked AVAX and pay the transaction fee.
     * @param destination the address of the account the staked AVAX and validation reward (if applicable) are sent to at endTime.
     */

    constructor(
        nodeid:Buffer = Buffer.alloc(32), 
        weight:number = 0, 
        startTime:number = 0, 
        endTime:number = 0, 
        networkid:number = 0, 
        nonce:number = 0,
        destination:Buffer = Buffer.alloc(32)
    ) {
        this.nodeid = nodeid;
        this.weight.writeUInt32BE(weight, 0);
        this.startTime.writeUInt32BE(startTime, 0);
        this.endTime.writeUInt32BE(endTime, 0);
        this.networkid.writeUInt32BE(networkid, 0);
        this.nonce.writeUInt32BE(nonce, 0);
        this.destination = destination;
    }
}

/**
 * Class representing an unsigned add default subnet delegator tx.
 */
export class UnsignedAddDefaultSubnetDelegatorTx {
    protected transaction:AddDefaultSubnetDelegatorTx;

    getTransaction = ():AddDefaultSubnetDelegatorTx => {
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
     * @param kc An [[PlatformKeyChain]] used in signing
     * 
     * @returns A signed [[Tx]]
     */
    sign(kc:PlatformKeyChain):Tx {
        let txbuff = this.toBuffer();
        // let msg:Buffer = Buffer.from(createHash('sha256').update(txbuff).digest()); 
        // let sigs:Array<Credential> = this.transaction.sign(msg, kc);
        let sigs:Array<Credential> = [];
        return new Tx(this, sigs);
    }

    constructor(transaction:AddDefaultSubnetDelegatorTx = undefined) {
        this.transaction = transaction;
    }
}

/**
 * Class representing a signed transaction.
 */
export class Tx {
    protected unsignedTx:UnsignedAddDefaultSubnetDelegatorTx = new UnsignedAddDefaultSubnetDelegatorTx();
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
        this.unsignedTx = new UnsignedAddDefaultSubnetDelegatorTx();
        offset = this.unsignedTx.fromBuffer(bytes, offset);
        let numcreds:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.credentials = [];
        // for(let i = 0; i < numcreds; i++) {
        //     let credid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        //     offset += 4;
        //     let cred:Credential = SelectCredentialClass(credid);
        //     offset = cred.fromBuffer(bytes, offset);
        //     this.credentials.push(cred);
        // }
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
        // for(let i = 0; i < this.credentials.length; i++) {
        //     let credid:Buffer = Buffer.alloc(4);
        //     credid.writeUInt32BE(this.credentials[i].getCredentialID(), 0);
        //     barr.push(credid);
        //     bsize += credid.length;
        //     let credbuff:Buffer = this.credentials[i].toBuffer();
        //     bsize += credbuff.length;
        //     barr.push(credbuff)
        // }
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
    constructor(unsignedTx:UnsignedAddDefaultSubnetDelegatorTx = undefined, credentials:Array<Credential> = undefined) {
        if(typeof unsignedTx !== 'undefined'){
            this.unsignedTx = unsignedTx;
            if(typeof credentials !== 'undefined'){
                this.credentials = credentials
            }
        }
    }
}