import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    /** Epoch ms de credenciais_atualizadas_em no momento do login. */
    credAt?: number;
  }
  interface Session {
    user: {
      id: string;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    credAt?: number;
  }
}
