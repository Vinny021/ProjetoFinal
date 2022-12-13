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
      console.log("entrou insertFiles");
      const body = request.body;

      // code: 0 -> ultimo pacote
      // code: 1 -> primeiro pacote
      // demais: -> pacotes intermediários
      console.log(`package numero: ${body.packageNumber}\n`);
      console.log(body);
      if (body.packageNumber == 1) {
        const extension = body.file.split(";")[0].split("/")[1];
        const base64Data = body.file.split(`base64,`)[1];

        await manager
          .createQueryBuilder()
          .insert()
          .into("public.dns")
          .values({
            id: `${body.fileId}`,
            filename: body.fileName,
            category: body.category,
            extension: extension,
            path: base64Data,
          })
          .execute();
        response.status(200).send();
      } else if (body.packageNumber != 0) {
        const dns = await manager
          .createQueryBuilder()
          .select("path")
          .from("dns", "dns")
          .where(`id = '${body.fileId}'`)
          .getRawOne();
        const newFile = dns.path + body.file;
        await manager
          .createQueryBuilder()
          .update("dns")
          .set({
            path: newFile,
          })
          .execute();

        response.status(200).send();
      } else {
        console.log('\n\nENTROU 0\n\n');
        const dns = await manager
          .createQueryBuilder()
          .select("path, extension")
          .from("dns", "dns")
          .where(`id = '${body.fileId}'`)
          .getRawOne();
        console.log(`\n\n${dns}\n\n`);
        const newFile = dns.path + body.file;
        await manager
          .createQueryBuilder()
          .update("dns")
          .set({
            path: newFile,
          })
          .execute();

        fs.writeFile(
          `D:\\com242\\media\\${body.fileId}.${dns.extension}`,
          newFile,
          "base64",
          function (err) {
            console.log(err);
          }
        );

        // chama o broker: subscriptiion na fila (id do arquivo) e publish no tópico (categoria)
        await axios({
          method: "post",
          url: "http://127.0.0.1:5000/newFile",
          headers: {
            "Content-type": "application/json",
          },
          data: {
            fileId: `${body.fileId}`,
            fileName: body.fileName,
            extension: dns.extension,
            category: body.category,
          },
        }).catch((error) => {
          console.log(error);
        });

        // const result = await manager
        //   .createQueryBuilder()
        //   .select("*")
        //   .from("public.dns", "dns")
        //   .where(`id = '${body.fileId}'`)
        //   .getRawOne();

        response.status(200).send();
      }
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
      console.log("entrou insertFileInDNS");
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
            extension: body.extension
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
      console.log("entrou notifyRequest");
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
      console.log("entrou downloadFile");
      const body = request.body;

      console.log(body);

      fs.writeFile(
        `D:\\com242\\media\\${body.fileId}.${body.extension}`,
        body.path,
        "base64",
        async function (err) {
          if (err) {
            response.status(400).send(err);
          } else {
            await manager
              .createQueryBuilder()
              .update("dns")
              .set({
                path: body.path,
              })
              .where(`id = '${body.fileId}'`)
              .execute();
            // chama o broker: subscriptiion na fila (id do arquivo) e publish no tópico (categoria)
            await axios({
              method: "post",
              url: "http://127.0.0.1:5000/newFile",
              data: {
                fileId: body.fileId,
                fileName: body.fileName,
                category: body.category,
                extension: body.extension,
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
      console.log("entrou transferFile");
      const body = request.body;

      const file = await manager
        .createQueryBuilder()
        .select("*")
        .from("dns", "dns")
        .where(`id = '${body.fileId}'`)
        .getRawOne();

      console.log(file);

      await axios({
        method: "post",
        url: `http://${body.ip}:${body.port}/downloadFile`,
        data: {
          fileId: body.fileId,
          path: file.path,
          category: file.category,
          fileName: file.filename,
          extension: file.extension,
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
