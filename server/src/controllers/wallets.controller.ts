import { Request, Response } from "express";
import pool from "../db/connection";
const web3 = require("web3");
import dotenv from "dotenv";
import Web3 from "web3";
import { decryptData, decryptData2 } from "../utils/encrypt";
import { getNonce, saveTransaction } from "./transactions.controller";

dotenv.config();

export const getBalances = async (req: Request | any, res: Response) => {
  try {
    const web3 = new Web3(process.env.BSC_TESTNET_NODE!);
    const id = req.user.id;
    const coin = req.params.coin;
    const myWallet = await pool.query(
      `SELECT address FROM "Wallets" WHERE "UserId"=${id} AND "coin"='${coin}'`
    );
    const address = myWallet.rows[0].address;
    // const address = '0xAA25577211Ea38Ed196C9526106f2698f3C532a4';
    let balance: any = await web3.eth.getBalance(address);
    let decimal = process.env.BSC_TOKEN_DECIMAL! as unknown as number;
    balance = (balance as unknown as number) / decimal;

    return res.status(200).json({
      balance,
    });
  } catch (error: String | String[] | any) {
    if (error.message.includes(`(reading 'address')`)) {
      return res.status(404).json({
        message: "Unsupported Token",
      });
    }
    return res.status(500).json({
      message: "An Unexpected Error Occured",
    });
  }
};

export const getCryptoWallets = async (req: Request, res: Response) => {
  const id = req.user.id;
  try {
    const allWallets = await pool.query(
      `SELECT address, coin FROM "Wallets" WHERE "UserId"=${id}`
    );
    let wallets = allWallets.rows;
    wallets.forEach((wallet: any) => {
      wallet.balance = 0;
    });
    return res.status(200).json(wallets);
  } catch (error: any) {
    console.log(error.message);
  }
};

export const getBalance2 = async (
  req: Request | any,
  res: Response,
  address: string
) => {
  try {
    const web3 = new Web3(process.env.BSC_TESTNET_NODE!);
    // const id = req.user.id;
    // const coin = req.params.coin;
    // const myWallet = await pool.query(
    //   `SELECT address FROM "Wallets" WHERE "UserId"=${id}`
    // );
    // const address = myWallet.rows[0].address;
    let balance: any = await web3.eth.getBalance(address);
    let decimal = process.env.BSC_TOKEN_DECIMAL! as unknown as number;
    balance = (balance as unknown as number) / decimal;
    return balance;
  } catch (error: String | String[] | any) {
    console.log("Wallet with error:", address);
    if (error.message.includes(`(reading 'address')`)) {
      return res.status(404).json({
        message: "Unsupported Token",
      });
    }
    return res.status(500).json({
      message: "An Unexpected Error Occured",
    });
  }
};

export const getUserWallet = async (req: Request, res: Response) => {
  const id = req.user.id;
  try {
    const myWallet = await pool.query(
      `SELECT address, coin FROM "Wallets" WHERE "UserId"=${id}`
    );

    /**
     * development code start
     */

    const wallets = myWallet.rows;
    // console.log(wallets);

    const walletsWithBal = [];
    for (let i = 0; i < wallets.length; i++) {
      const coin = wallets[i].coin;
      const address = wallets[i].address;

      const balance = await getBalance2(req, res, address);
      walletsWithBal.push({
        address,
        coin,
        balance,
      });
    }
    // console.log("DEVELOPMENT\n", walletsWithBal)

    /**
     * development code end
     */
    return res.status(200).json(walletsWithBal);
    // return res.status(200).json(myWallet.rows);
  } catch (error: any) {
    console.log(error.message);
    // return res.status(500).json({
    //   message: "An Unexpected Error Occured",
    // });
  }
};

export const getUserWallet2 = async (req: Request, res: Response) => {
  const id = req.user.id;
  try {
    const myWallet = await pool.query(
      `SELECT address, coin FROM "Wallets" WHERE "UserId"=${id}`
    );

    /**
     * development code start
     *

    const wallets = myWallet.rows;
    // console.log(wallets);
    
    const walletsWithBal = [];
    for (let i = 0; i < wallets.length; i++) {
      const coin = wallets[i].coin;
      const address = wallets[i].address;

      const balance = await getBalance2(req, res, address);
      walletsWithBal.push({
        address,
        coin,
        balance
      });
    }
    // console.log("DEVELOPMENT\n", walletsWithBal)

    /**
     * development code end
     */
    // return res.status(200).json(walletsWithBal);
    return res.status(200).json(myWallet.rows);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({
      message: "An Unexpected Error Occured",
    });
  }
};

export const transfer = async (req: Request, res: Response) => {
  const web3 = new Web3(process.env.BSC_TESTNET_NODE!);
  const { toAddress, amount, fromAddress } = req.body;

  if (toAddress === "" || fromAddress === "" || amount === "") {
    return res.status(400).json({ message: "Please complete all fields." });
  }

  try {
    let data = await pool.query(
      `SELECT "private_key" FROM "Wallets" WHERE address='${fromAddress}'`
    );

    let encryptedPrivateKey = data.rows[0].private_key;

    let privateKey = decryptData(
      "private_key.pem",
      encryptedPrivateKey
    ) as unknown as string;

    let weiamount = amount * parseInt(process.env.BSC_TOKEN_DECIMAL!);
    let balance = await web3.eth.getBalance(fromAddress);
    console.log("from balance:", balance);

    if (weiamount < +balance * parseInt(process.env.BSC_TOKEN_DECIMAL!)) {
      // const nonce = await web3.eth.getTransactionCount(toAddress, "latest"); // nonce starts counting from 0
      const nonce = await getNonce(req, res);

      const gas = await web3.eth.estimateGas({
        to: toAddress,
        from: fromAddress,
        value: weiamount,
        nonce,
      });

      const gasPrice = await web3.eth.getGasPrice();

      const signed: any = await web3.eth.accounts.signTransaction(
        {
          to: toAddress,
          from: fromAddress,
          value: weiamount,
          gas,
          gasPrice,
          nonce,
        },
        privateKey
      );

      let txHash = await web3.eth.sendSignedTransaction(signed.rawTransaction);

      console.log("fromAddress", fromAddress);
      console.log("toAddress", toAddress);
      console.log("amount", amount);
      console.log("nonce", nonce);
      console.log("gas", gas);
      console.log("gasPrice", gasPrice);
      console.log("signed", signed);
      console.log("txHash", txHash);

      const meta = JSON.stringify({nonce, gas, gasPrice, signed, txHash});
      const txDeets = {fromAddress, toAddress, amount, meta, status: "Successful"};
      saveTransaction(req, txDeets);

      return res.status(200).json({
        txHash,
        message: `Transfer of ${amount} BNB was successful.`,
      });
    } else
      return res.status(403).json({
        message: "Insufficient Balance",
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "An error occured." });
  }
};
