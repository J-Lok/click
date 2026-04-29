import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Min. 3 caractères'),
  password: z.string().min(8, 'Min. 8 caractères'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

const phoneRegex = /^\+237[0-9]{9}$/;
export const signupSimpleSchema = z.object({
  username: z.string().min(3, 'Min. 3 caractères').max(50),
  password: z.string().min(8, 'Min. 8 caractères'),
  name: z.string().min(2, 'Min. 2 caractères').max(100),
  phone: z.string().regex(phoneRegex, 'Numéro camerounais : +237XXXXXXXXX'),
  email: z.string().email().optional().or(z.literal('')),
});

export type SignupSimpleFormData = z.infer<typeof signupSimpleSchema>;
