// =============================================================
//  Rotas de Cards - ESTE É O ARQUIVO DA SUA PROVA
//  Complete cada bloco marcado com // TODO:
//  Consulte src/routes/decks.ts como exemplo e o ROTEIRO para
//  os códigos HTTP e formatos de resposta exigidos.
// =============================================================
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function cardRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // -----------------------------------------------------------
  // Schema reutilizável para o parâmetro :id da URL
  // -----------------------------------------------------------
  // TODO: crie o schema `paramsSchema` com o campo `id`
  //       (número inteiro positivo; dica: z.coerce.number())
  // const paramsSchema = ...
  const paramsSchema = z.object({ 
    id: z.coerce.number().int().positive(), 
  }); 

  // ===========================================================
  // ROTA 1 - POST /cards  (Criar card)              [3,0 pts]
  // ===========================================================
  // TODO: crie o schema `createCardSchema` com:
  //   - question: string, obrigatória, mínimo 3 caracteres
  //   - answer:   string, obrigatória, mínimo 1 caractere
  //   - deckId:   número inteiro positivo
  // const createCardSchema = ...
  const createCardSchema = z.object({ 
    question: z.string().min(3), 
    answer: z.string().min(1), 
    deckId: z.number().int().positive(), 
  }); 

  // Bônus ><
  const reviewSchema = z.object({ 
    grade: z.number().int().min(1).max(5), 
  }); 

  server.post(
    "/cards",
    {
      // TODO: registre o schema do body aqui -> schema: { body: createCardSchema }
      schema: { 
        body: createCardSchema 
      },
    },
    async (request, reply) => {
      // TODO:
      // 1. Pegue question, answer e deckId de request.body
      const { question, answer, deckId } = request.body; 
      // 2. Verifique se o baralho (deckId) existe -> se não, 404
      const deck = await prisma.deck.findUnique({ 
        where: { id: deckId }, 
      }); 
      if (!deck) { 
        return reply.status(404).send({ 
          message: "Baralho não encontrado", 
        }); 
      }
      // 3. Crie o card com prisma.card.create(...)
      const card = await prisma.card.create({ 
        data: { 
          question, 
          answer, 
          deckId, 
        }, 
      });
      // 4. Responda com status 201 e o card criado
      return reply.status(201).send(card);
    },
  );

  // ===========================================================
  // ROTA 2 - GET /cards  (Listar cards)             [2,0 pts]
  // ===========================================================
  server.get("/cards", async (request, reply) => {
    // TODO:
    // 1. Busque todos os cards com prisma.card.findMany(...)
    const cards = await prisma.card.findMany({ 
    // 2. Inclua o baralho vinculado retornando apenas id e name:
    //      include: { deck: { select: { id: true, name: true } } }
      include: { 
        deck: { 
          select: { 
            id: true, 
            name: true, 
          }, 
        }, 
      },
    // 3. Ordene por id crescente
      orderBy: { 
        id: "asc", 
      }, 
    });
    // 4. Responda com status 200 e a lista (array)
    return reply.status(200).send(cards);
  });

  // ===========================================================
  // ROTA 3 - GET /cards/:id  (Buscar card por ID)   [2,0 pts]
  // ===========================================================
  server.get(
    "/cards/:id",
    {
      // TODO: registre o schema dos params -> schema: { params: paramsSchema }
      schema: {
        params: paramsSchema
      },
    },
    async (request, reply) => {
      // TODO:
      // 1. Pegue o id de request.params
      const{ id } = request.params
      // 2. Busque com prisma.card.findUnique(...) incluindo o deck
      const card = await prisma.card.findUnique({ 
        where: { id }, 
        include: { 
          deck: { 
            select: { 
              id: true, 
              name: true, 
            }, 
          }, 
        }, 
      }); 
      // 3. Se não existir -> 404 { message: "Card não encontrado" }
      if (!card) {
        return reply.status(400).send({
          message: "Card não encontrado",
        })
      }
      // 4. Se existir -> 200 com o card
      return reply.status(200).send(card);
    },
  );

  // ===========================================================
  // ROTA 4 - DELETE /cards/:id  (Remover card)      [2,0 pts]
  // ===========================================================
  server.delete(
    "/cards/:id",
    {
      // TODO: registre o schema dos params
      schema: {
        params: paramsSchema
      },
    },
    async (request, reply) => {
      // TODO:
      // 1. Pegue o id de request.params
      const{ id } = request.params
      // 2. Verifique se o card existe -> se não, 404
      const card = await prisma.card.findUnique({ 
        where: { id }, 
      });

      if (!card) {
        return reply.status(400).send({
          message: "Card não encontrado",
        })
      }
      // 3. Remova com prisma.card.delete(...)
      await prisma.card.delete({
        where: {id},
      })
      // 4. Responda 200 { message: "Card removido com sucesso" }
      return reply.status(200).send({ message: "Card removido com sucesso" });
    },
  );

  // ===========================================================
  // BÔNUS - POST /cards/:id/review  (Registrar revisão) [+1,0]
  // ===========================================================
  // TODO (opcional): crie `reviewSchema` com:
  //   - grade: número inteiro de 1 a 5
  server.post(
    "/cards/:id/review",
    {
      // TODO: registre params e body
      schema: { 
        params: paramsSchema, 
        body: reviewSchema, 
      },
    },
    async (request, reply) => {
      // TODO (opcional):
      // 1. Verifique se o card existe -> se não, 404
      const { id } = request.params; 
      const { grade } = request.body; 

      const card = await prisma.card.findUnique({ 
        where: { id }, 
      }); 
 
      if (!card) { 
        return reply.status(404).send({ 
          message: "Card não encontrado", 
        }); 
      }
      // 2. Atualize com prisma.card.update(...):
      //      reviewCount: { increment: 1 }
      //      lastGrade: grade
      //      lastReviewedAt: new Date()
       const updatedCard = await prisma.card.update({ 
        where: { id }, 
        data: { 
          reviewCount: { increment: 1 }, 
          lastGrade: grade, 
          lastReviewedAt: new Date(), 
        }, 
      });
      // 3. Responda 200 com o card atualizado
      return reply.status(200).send(updatedCard);
    },
  );
}