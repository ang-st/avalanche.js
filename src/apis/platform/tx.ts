/**
 * @packageDocumentation
 * @module PlatformAPI-Transactions
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import { PlatformConstants, Signature } from './types';
import { PlatformKeyChain, PlatformKeyPair } from "./keychain";
import BN from "bn.js";
import createHash from 'create-hash';

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
    protected nodeid:Buffer = Buffer.alloc(20);
    protected weight:Buffer = Buffer.alloc(8);
    protected startTime:Buffer = Buffer.alloc(8);
    protected endTime:Buffer = Buffer.alloc(8);
    protected networkid:Buffer = Buffer.alloc(4);
    protected nonce:Buffer = Buffer.alloc(8);
    protected destination:Buffer = Buffer.alloc(20);

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
        this.nodeid = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
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
        this.destination = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
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
     * Takes the bytes of an [[UnsignedTx]] and returns a Signature
     * 
     * @param msg A Buffer for the [[UnsignedTx]] 
     * @param kc An [[PlatformKeyChain]] used in signing
     * 
     * @returns A Signature
     */

    sign(msg:Buffer, keypair:PlatformKeyPair):Signature {
        let signval:Buffer = keypair.sign(msg);
        let sig:Signature = new Signature();
        sig.fromBuffer(signval);
        return sig;
    }

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
        nodeid:string = "", 
        weight:number = 0, 
        startTime:number = 0, 
        endTime:number = 0, 
        networkid:number = 0, 
        nonce:number = 0,
        destination:string = "" 
    ) {
        this.nodeid = bintools.avaDeserialize(nodeid);
        this.weight = bintools.fromBNToBuffer(new BN(weight), 8);
        this.startTime = bintools.fromBNToBuffer(new BN(startTime), 8);
        this.endTime = bintools.fromBNToBuffer(new BN(endTime), 8);
        this.networkid.writeUInt32BE(networkid, 0);
        this.nonce = bintools.fromBNToBuffer(new BN(nonce), 8);
        this.destination = bintools.avaDeserialize(destination);
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
        const txtype:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.transaction = SelectTxClass(txtype);
        return this.transaction.fromBuffer(bytes, offset);
    }


    toBuffer():Buffer {
        const txtype:Buffer = Buffer.alloc(4);
        txtype.writeUInt32BE(this.transaction.getTxType(), 0);
        const basebuff:Buffer = this.transaction.toBuffer();
        return Buffer.concat([txtype, basebuff], txtype.length + basebuff.length);
    }

    /**
     * Signs this [[UnsignedAddDefaultSubnetDelegatorTx]] and returns signed [[Tx]]
     * 
     * @param kc An [[PlatformKeyChain]] used in signing
     * 
     * @returns A signed [[Tx]]
     */
    sign(keypair:PlatformKeyPair):PlatformTx {
        const txbuff:Buffer = this.toBuffer();
        const msg:Buffer = Buffer.from(createHash('sha256').update(txbuff).digest()); 
        const signature:Signature = this.transaction.sign(msg, keypair);
        return new PlatformTx(this, signature);
    }

    constructor(transaction:AddDefaultSubnetDelegatorTx = undefined) {
        this.transaction = transaction;
    }
}

/**
 * Class representing a signed transaction.
 */
export class PlatformTx {
    protected unsignedTx:UnsignedAddDefaultSubnetDelegatorTx = new UnsignedAddDefaultSubnetDelegatorTx();
    protected signature:Signature;

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
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Tx]].
     */
    toBuffer():Buffer {
        const txbuff:Buffer = this.unsignedTx.toBuffer();
        const bsize:number = txbuff.length + this.signature.toBuffer().length;
        const barr:Array<Buffer> = [txbuff, this.signature.toBuffer()];
        const buff:Buffer = Buffer.concat(barr, bsize);
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
     * @param unsignedTx [[UnsignedAddDefaultSubnetDelegatorTx]]
     * @param signature Signature
     */
    constructor(unsignedTx:UnsignedAddDefaultSubnetDelegatorTx = undefined, signature:Signature = undefined) {
        if(typeof unsignedTx !== 'undefined'){
            this.unsignedTx = unsignedTx;
            this.signature = signature;
        }
    }
}