import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorBoundaryState = {
  hasError: boolean;
  error?: unknown;
};

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep in console for debugging
    console.error("App crashed:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const err = this.state.error;
    const message =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : typeof err === "string"
          ? err
          : JSON.stringify(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const details = [message, stack].filter(Boolean).join("\n\n");

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Ocorreu um erro na tela</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Clique em “Recarregar” para tentar novamente. Se o erro voltar, abra “Detalhes técnicos”
              e me envie a mensagem.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button onClick={this.handleReload}>Recarregar</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                Voltar ao início
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(details);
                  } catch {
                    // ignore
                  }
                }}
              >
                Copiar detalhes
              </Button>
            </div>

            <details className="rounded-md border border-border bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                {details || "Sem detalhes disponíveis."}
              </pre>
            </details>
          </CardContent>
        </Card>
      </main>
    );
  }
}
