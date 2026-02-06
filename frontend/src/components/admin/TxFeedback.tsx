"use client";

export function TxFeedback({ hash, error }: { hash: string | undefined; error: Error | null }) {
  if (error) {
    const msg = error.message.includes("User rejected")
      ? "Transaction rejetée"
      : error.message.split("\n")[0];
    return (
      <p className="mt-2 text-sm text-red-400 truncate">
        Erreur: {msg}
      </p>
    );
  }
  if (!hash) return null;
  return (
    <p className="mt-2 text-sm text-gray-400 font-mono truncate">
      Tx: {hash}
    </p>
  );
}
