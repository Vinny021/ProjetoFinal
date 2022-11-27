import { connect } from '../database/index';
import { Request, Response } from "express";
import {getConnectionManager, getManager, getConnection} from "typeorm";

connect();
const manager = getManager();

export class PokemonController{
    async index(request: Request, response: Response){

        try {

            var where = [];

        // console.log(await manager.createQueryBuilder().select('*').from('northwind.orders', 'Order').getRawMany());
        // const orders = await manager.createQueryBuilder().select('*').from('northwind.orders', 'Order').getRawMany();

        const body = request.body;

        // o body da requisição vai ter um vetor com 4 subvetores (pokemon, sprites, regions e evolutions)
        // cada um desses subvetores vão conter os campos que o usuário desejará que apareçam no relatório
        const pokemonFields =(body.fields.pokemon)?(body.fields.pokemon):'';
        const spritesFields = (body.fields.sprites)?body.fields.sprites:'';
        const regionsFields = (body.fields.regions)?body.fields.regions:'';
        const evolutionsFields = (body.fields.evolution)?body.fields.evolution:'';

        let fields = [];

        if(pokemonFields && pokemonFields != ''){
            fields.push(pokemonFields);
        }

        if(spritesFields && spritesFields != ''){
            fields.push(spritesFields);
        }

        if(regionsFields && regionsFields != ''){
            fields.push(regionsFields);
        }

        if(evolutionsFields && evolutionsFields != ''){
            fields.push(evolutionsFields);
        }


        let queryBuilder = manager.createQueryBuilder()
            .select(`${fields.join(',')}`)
            .from('pokemons', 'poke');

        if(spritesFields && spritesFields != ''){
            queryBuilder = queryBuilder.leftJoin('sprites', 'sprites', 'poke.dex_num = sprites.pokemon_id');
        }

        if(regionsFields && regionsFields != ''){
            queryBuilder = queryBuilder.leftJoin('regions', 'region', 'poke.dex_num BETWEEN region.id_first_pokemon AND region.id_last_pokemon');
        }

        if(evolutionsFields && evolutionsFields != ''){
            queryBuilder = queryBuilder.leftJoin('evolutions', 'Evolution', 'poke.evolution_familly_id = Evolution.familly_id');
        }


        if (body.conditions.hasOwnProperty("type")) {
            where.push(`(poke.type1 IN ('${body.conditions.type.join(`','`)}') OR poke.type2 IN ('${body.conditions.type.join(`','`)}'))`);
        }

        if (body.conditions.hasOwnProperty("region")) {
            const region = await manager.createQueryBuilder()
                .select('*')
                .from('regions', 'region')
                .where(`name IN ('${body.conditions.region.join(`','`)}')`)
                .getRawMany();

            let less_id = region[0].id_first_pokemon;
            let higher_id = region[0].id_last_pokemon;

            region.forEach((element) => {
                if(less_id > element.id_first_pokemon){
                    less_id = element.id_first_pokemon
                }
                if(higher_id < element.id_last_pokemon){
                    higher_id = element.id_last_pokemon;
                }
            });
            
            where.push(`poke.dex_num BETWEEN ${less_id} AND ${higher_id}`);
        }

        if (body.conditions.hasOwnProperty("pokedex")) {            
            where.push(`poke.dex_num BETWEEN ${body.conditions.pokedex[0]} AND ${body.conditions.pokedex[1]}`);
        }

        queryBuilder = queryBuilder.where(`${where.join(" AND ")}`);

        const results = await queryBuilder.getRawMany();


        return response.status(200).send(results)
            
        } catch (error) {
            return response.status(400).send({
                error: "Houve um erro na aplicação",
                message: error
            })
        }

        
    }
}