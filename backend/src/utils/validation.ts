import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export async function validateDto<T>(
  cls: new () => T,
  payload: unknown,
): Promise<{ data?: T; errors?: any[] }> {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance as any, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length) {
    return {
      errors: errors.map((e) => ({
        property: e.property,
        constraints: e.constraints,
      })),
    };
  }
  return { data: instance };
}
