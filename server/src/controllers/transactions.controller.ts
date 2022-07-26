import { Request, Response } from "express";
import pool from "../db/connection";

export const getTransactions = async (req: Request, res: Response) => {
  try {
    // const allTransactions = await pool.query(`
    //     SELECT * FROM "Transactions" WHERE "UserId"='${req.user.id}'
    //     ORDER BY "createdAt" DESC
    //     `);

    // const allWallets = await pool.query(`
    //     SELECT address FROM "Wallets" WHERE "UserId"='${req.user.id}'
    //     `);
    // const wallets = allWallets.rows;

    const allTransactions = await pool.query(`
        SELECT * FROM "Transactions" 
        WHERE "to" IN (SELECT address FROM "Wallets" WHERE "UserId"='${req.user.id}')
        OR "from" IN (SELECT address FROM "Wallets" WHERE "UserId"='${req.user.id}')
        ORDER BY "createdAt" DESC
        `);
    console.log(allTransactions.rows);
    return res.status(200).send(allTransactions.rows);
  } catch (error: any) {
    console.log(error.message);
  }
};

export const getNonce = async (req: Request, res: Response) => {
  try {
    const latestTransactions = await pool.query(`
          SELECT * FROM "Transactions" WHERE "UserId"='${req.user.id}'
          ORDER BY "createdAt" DESC
          LIMIT 1
          `);

    if (!latestTransactions.rows[0]) {
      const nonce = 0;
      console.log("NONCE:", nonce);
      return nonce;
      // return res.status(404).json({
      //   message: "User not found."
      // });
      //   return res.status(400).json({ nonce });
    }

    const meta = latestTransactions.rows[0].meta;
    const nonce = JSON.parse(meta).nonce + 1;
    console.log("NONCE:", nonce);
    return nonce;
    // return res.status(200).json({ nonce });
  } catch (error: any) {
    console.log(error.message);
  }
};

export const saveTransaction = async (req: Request, payload: any) => {
  const id = req.user.id;

  try {
    console.log("BODY??:", req.body);
    const query = `INSERT INTO "Transactions" (amount, "to", "from","meta","status", "createdAt", "updatedAt", "UserId") 
      VALUES('${payload.amount}', '${payload.toAddress}', '${
      payload.fromAddress
    }','${payload.meta}','${
      payload.status
    }', (to_timestamp(${Date.now()} / 1000.0)), (to_timestamp(${Date.now()} / 1000.0)), '${id}')`;

    pool.query(query, (err, result) => {
      if (!err) {
        console.log("Saved to DB");
        console.log(result.rows);
      } else {
        console.log(err.message);
      }
    });
    // res.send(req.body);
    return true;
  } catch (error) {
    console.log(error);
  }
};
