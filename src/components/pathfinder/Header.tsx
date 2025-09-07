/**
 * Copyright 2025 Pathfinder AI Contributors
 *
 * Licensed under the MIT License or Apache 2.0 License.
 * See LICENSE-MIT or LICENSE-APACHE for details.
 */

import { Logo } from "./Logo";
import { AuthButton } from "./AuthButton";

export function Header() {
  return (
    <header className="py-8 md:py-12 px-4 md:px-8">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Logo className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-headline">
              Pathfinder AI
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your personal guide to a bright future.
            </p>
          </div>
        </div>
        <AuthButton />
      </div>
    </header>
  );
}

    