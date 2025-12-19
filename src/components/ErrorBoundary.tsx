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

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Ocorreu um erro na tela</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Isso normalmente acontece por um dado inesperado nos gráficos. Clique em
              “Recarregar” para tentar novamente.
            </p>
            <div className="flex gap-2">
              <Button onClick={this.handleReload}>Recarregar</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")}
              >
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
}
