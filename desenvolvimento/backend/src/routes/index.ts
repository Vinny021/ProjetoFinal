import { Router } from "express";
import { connect } from "../database/index";
import { getConnectionManager, getManager, getConnection } from "typeorm";
import { PokemonController } from "../controllers/PokemonController";
import { OrderController } from "../controllers/OrderController";

connect();
const manager = getManager();

const routes = Router();

// quando irá inserir o arquivo pela primeira vez
// origem: front-end
routes.route("/insertFiles").post(new OrderController().insertFiles);

// quando chegar aviso de inserção no tópico de categorias, inserir no dns dos inscritos para falar que o arquivo existe
// origem: broker
routes.route("/insertFileInDNS").post(new OrderController().insertFileInDNS);

// primeira rota de download, backend manda porta, id e ip do file para o broker
// origin: front-end
routes.route('/notifyRequest').post(new OrderController().notifyRequest);

// essa é a função de quem POSSUI o arquivo, nela irá transferir para quem QUER o arquivo, chamando o backend via IP e Porta recebnidos
// origin: broker
routes.route('/transferFile').post(new OrderController().transferFile);

// função para quem QUER o arquivo, fazer download do mesmo
// origin: back-end
routes.route('/downloadFile').post(new OrderController().downloadFile);

export { routes };
