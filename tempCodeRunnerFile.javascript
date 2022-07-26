// import dotenv from "dotenv"
import { NextFunction, Request, Response } from "express";
import Web3 from 'web3';

dotenv.config();





export const createAcount = async () => {
    try {

        const BSC_TESTNET_NODE = `https://data-seed-prebsc-1-s1.binance.org:8545/`
        const web3 = new Web3(BSC_TESTNET_NODE)
        console.log("connection succesful")
    } catch (e) {
        console.log("error", e)
    }


    // const account = web3.eth.accounts.create()
    // console.log(account)    
}

createAcount()