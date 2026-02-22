import { ORPCError } from "@orpc/server";
import {
   createAction,
   deleteAction,
   getAction,
   listActions,
   updateAction,
} from "@packages/database/repositories/action-repository";
import { actions } from "@packages/database/schemas/actions";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { protectedProcedure } from "../server";

const createActionSchema = createInsertSchema(actions).pick({
   name: true,
   eventPatterns: true,
   description: true,
   matchType: true,
});

const updateActionSchema = createInsertSchema(actions)
   .pick({
      name: true,
      description: true,
      eventPatterns: true,
      matchType: true,
      isActive: true,
   })
   .partial()
   .extend({ id: z.string().uuid() });

// =============================================================================
// Action Procedures
// =============================================================================

export const create = protectedProcedure
   .input(createActionSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db, userId } = context;

      const action = await createAction(db, {
         organizationId,
         name: input.name,
         eventPatterns: input.eventPatterns,
         description: input.description,
         matchType: input.matchType,
         createdBy: userId,
      });

      return action;
   });

export const list = protectedProcedure.handler(async ({ context }) => {
   const { organizationId, db } = context;

   return await listActions(db, organizationId);
});

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const action = await getAction(db, input.id);

      if (!action || action.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Ação não encontrada.",
         });
      }

      return action;
   });

export const update = protectedProcedure
   .input(updateActionSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const action = await getAction(db, input.id);

      if (!action || action.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Ação não encontrada.",
         });
      }

      const { id: _id, ...updateData } = input;
      const updated = await updateAction(db, input.id, updateData);

      return updated;
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const action = await getAction(db, input.id);

      if (!action || action.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Ação não encontrada.",
         });
      }

      await deleteAction(db, input.id);

      return { success: true };
   });
