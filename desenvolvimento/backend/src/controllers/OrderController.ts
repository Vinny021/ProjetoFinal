import { connect } from "../database/index";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import AWS from "aws-sdk";
const s3 = new AWS.S3({ signatureVersion: "v4" });
import { getConnectionManager, getManager, getConnection } from "typeorm";
import axios from "axios";
require("dotenv").config();
import moment from "moment-timezone";

connect();
const manager = getManager();

export class OrderController {
  async insertFiles(request: Request, response: Response) {
    try {
      console.log('entrou insertFiles');
      const id = uuidv4();
      const body = request.body;

      var base64Data: any;
      let extension = body.file.split(";")[0].split("/")[1];

      base64Data = body.file.split(`base64,`)[1];

      fs.writeFile(
        `D:\\com242\\media\\${id}.${extension}`,
        base64Data,
        "base64",
        function (err) {
          console.log(err);
        }
      );

      await manager
        .createQueryBuilder()
        .insert()
        .into("public.dns")
        .values({
          id: `${id}.${extension}`,
          filename: body.fileName,
          category: body.category,
          path: base64Data,
        })
        .execute();

      const result = await manager
        .createQueryBuilder()
        .select("*")
        .from("public.dns", "dns")
        .where(`id = '${id}.${extension}'`)
        .getRawOne();

      // chama o broker: subscriptiion na fila (id do arquivo) e publish no tópico (categoria)
      await axios({
        method: "post",
        url: "http://127.0.0.1:5000/newFile",
        headers: {
          'Content-type': "application/json"
        },
        data: {
          fileId: `${id}.${extension}`,
          fileName: body.fileName,
          category: body.category,
        }
      }).catch((error) => {
        console.log(error);
      });

      response.status(200).send(result);
    } catch (error) {
      return response.status(400).send({
        error: "Houve um erro na aplicação",
        message: error,
      });
    }
  }

  async getFilesAvailable(request: Request, response: Response) {
    try {
      const files = await manager
        .createQueryBuilder()
        .select()
        .from("dns", "dns")
        .getRawMany();

      response.status(200).send(files);
    } catch (error) {
      return response.status(400).send({
        error: "Houve um erro na aplicação",
        message: error,
      });
    }
  }

  async insertFileInDNS(request: Request, response: Response) {
    try {
      console.log('entrou insertFileInDNS');
      const body = request.body;

      const old = await manager
        .createQueryBuilder()
        .select("id")
        .from("dns", "dns")
        .where(`id = '${body.fileId}'`)
        .getRawOne();

      if (!old || old === null) {
        await manager
          .createQueryBuilder()
          .insert()
          .into("public.dns")
          .values({
            id: body.fileId,
            filename: body.fileName,
            category: body.category,
          })
          .execute();

        const result = await manager
          .createQueryBuilder()
          .select("*")
          .from("public.dns", "dns")
          .where(`id = '${body.fileId}'`)
          .getRawOne();

        response.status(200).send(result);
      } else {
        response.status(400).send({
          message: "Arquivo já existente",
        });
      }
    } catch (error) {
      return response.status(400).send({
        error: "Houve um erro na aplicação",
        message: error,
      });
    }
  }

  async notifyRequest(request: Request, response: Response) {
    try {
      console.log('entrou notifyRequest');
      const body = request.body;

      await axios({
        method: "post",
        url: "http://127.0.0.1:5000/requestFile",
        data: {
          fileId: body.fileId,
          ip: process.env.PUBLIC_IP,
          port: process.env.PUBLIC_PORT,
        },
      })
        .then(() => {
          response.status(200).send({
            message: "OK",
          });
        })
        .catch((error) => {
          response.status(400).send({
            message: error,
          });
        });
    } catch (error) {
      return response.status(400).send({
        error: "Houve um erro na aplicação",
        message: error,
      });
    }
  }

  async downloadFile(request: Request, response: Response) {
    try {
      console.log('entrou downloadFile');
      const body = request.body;

      fs.writeFile(
        `D:\\com242\\media\\${body.fileId}`,
        body.path,
        "base64",
        async function (err) {
          if (err) {
            response.status(400).send(err);
          } else {

            await manager.createQueryBuilder().update('dns').set({
              path: body.path
            }).where(`id = '${body.fileId}'`).execute()
            // chama o broker: subscriptiion na fila (id do arquivo) e publish no tópico (categoria)
            await axios({
              method: "post",
              url: "http://127.0.0.1:5000/newFile",
              data: {
                fileId: body.fileId,
                fileName: body.fileName,
                category: body.category,
              },
            }).catch((error) => {
              response.status(400).send({
                message: error,
              });
            });

            response.status(200).send({
              message: "ok",
            });
          }
        }
      );
    } catch (error) {
      return response.status(400).send({
        error: "Houve um erro na aplicação",
        message: error,
      });
    }
  }

  async transferFile(request: Request, response: Response) {
    try {
      console.log('entrou transferFile');
      const body = request.body;

      const file = await manager
        .createQueryBuilder()
        .select("*")
        .from("dns", "dns")
        .where(`id = '${body.fileId}'`)
        .getRawOne();

      await axios({
        method: "post",
        url: `http://${body.ip}:${body.port}/downloadFile`,
        data: {
          fileId: body.fileId,
          path: file.path,
          category: file.category,
          fileName: file.filename
        },
      }).catch((error) => {
        response.status(400).send({
          message: error,
        });
      });

      response.status(200).send({
        message: "ok",
      });
    } catch (error) {
      return response.status(400).send({
        error: "Houve um erro na aplicação",
        message: error,
      });
    }
  }
}
