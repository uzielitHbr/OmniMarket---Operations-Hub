import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 bg-muted/20"
      data-testid="not-found-page"
    >
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">404 - No Encontrado</CardTitle>
          <CardDescription>
            La página o recurso que buscas no existe o fue movido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Verifica la URL solicitada o regresa al panel principal de operaciones.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/" data-testid="back-to-home">
              Volver al Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
