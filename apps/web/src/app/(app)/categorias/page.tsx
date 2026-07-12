import { redirect } from "next/navigation";

// Categorias agora vivem junto de contas ("Contas e categorias").
export default function CategoriasPage() {
  redirect("/contas");
}
