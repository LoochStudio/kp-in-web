"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(_prevState: string, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Неверный email или пароль";
    }
    // redirectTo бросает исключение — его нужно пробросить дальше
    throw error;
  }
  return "";
}
