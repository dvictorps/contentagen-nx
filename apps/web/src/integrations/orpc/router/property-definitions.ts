import { ORPCError } from "@orpc/server";
import {
   createPropertyDefinition,
   deletePropertyDefinition,
   getPropertyDefinition,
   listPropertyDefinitions,
   updatePropertyDefinition,
} from "@packages/database/repositories/property-definition-repository";
import { propertyDefinitions } from "@packages/database/schemas/property-definitions";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { protectedProcedure } from "../server";

const createPropertyDefinitionSchema = createInsertSchema(
   propertyDefinitions,
).pick({
   name: true,
   type: true,
   description: true,
   eventNames: true,
   isNumerical: true,
   tags: true,
});

const updatePropertyDefinitionSchema = createInsertSchema(propertyDefinitions)
   .pick({
      name: true,
      type: true,
      description: true,
      eventNames: true,
      isNumerical: true,
      tags: true,
   })
   .partial()
   .extend({ id: z.string().uuid() });

// =============================================================================
// Property Definition Procedures
// =============================================================================

export const create = protectedProcedure
   .input(createPropertyDefinitionSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const definition = await createPropertyDefinition(db, {
         organizationId,
         name: input.name,
         type: input.type,
         description: input.description,
         eventNames: input.eventNames,
         isNumerical: input.isNumerical,
         tags: input.tags,
      });

      return definition;
   });

export const list = protectedProcedure.handler(async ({ context }) => {
   const { organizationId, db } = context;

   return await listPropertyDefinitions(db, organizationId);
});

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const definition = await getPropertyDefinition(db, input.id);

      if (!definition || definition.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Definição de propriedade não encontrada.",
         });
      }

      return definition;
   });

export const update = protectedProcedure
   .input(updatePropertyDefinitionSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const definition = await getPropertyDefinition(db, input.id);

      if (!definition || definition.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Definição de propriedade não encontrada.",
         });
      }

      const { id: _id, ...updateData } = input;
      const updated = await updatePropertyDefinition(db, input.id, updateData);

      return updated;
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const definition = await getPropertyDefinition(db, input.id);

      if (!definition || definition.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Definição de propriedade não encontrada.",
         });
      }

      await deletePropertyDefinition(db, input.id);

      return { success: true };
   });
