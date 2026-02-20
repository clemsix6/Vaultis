"use client";

import { useState } from "react";
import { ShieldAlert, Mail, CheckCircle, Clock, XCircle } from "lucide-react";
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useKYCStatus, useKYCSubmit } from "@/hooks";

interface KYCFormProps {
  address: `0x${string}`;
}

export function KYCForm({ address }: KYCFormProps) {
  const [email, setEmail] = useState("");
  const { request, isLoading } = useKYCStatus(address);
  const { submit, isSubmitting, error, isSuccess } = useKYCSubmit();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    submit(address, email);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-400 text-center py-4">Chargement du statut KYC...</p>
        </CardContent>
      </Card>
    );
  }

  // Already submitted
  if (request || isSuccess) {
    const status = request?.status ?? "pending";
    return (
      <Card glow={status === "approved"}>
        <CardHeader>
          <CardTitle>Verification KYC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            {status === "pending" && (
              <>
                <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Demande en cours de traitement</h3>
                <p className="text-gray-400">
                  Votre demande KYC a ete soumise avec l&apos;email <span className="text-white font-mono">{request?.email}</span>.
                  Un administrateur va examiner votre demande.
                </p>
              </>
            )}
            {status === "approved" && (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">KYC approuve</h3>
                <p className="text-gray-400">
                  L&apos;administrateur doit maintenant whitelister votre adresse on-chain pour finaliser l&apos;activation.
                </p>
              </>
            )}
            {status === "rejected" && (
              <>
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">KYC rejete</h3>
                <p className="text-gray-400">
                  Votre demande a ete rejetee. Contactez un administrateur pour plus d&apos;informations.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not submitted yet — show the form
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-yellow-500" />
          <CardTitle>Verification KYC requise</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 mb-6">
          Pour pouvoir acheter, vendre et detenir des actifs tokenises sur Vaultis,
          vous devez completer la verification KYC. Renseignez votre email pour soumettre votre demande.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Adresse wallet"
            value={address}
            disabled
            icon={<span className="text-xs text-gray-500">Auto</span>}
          />
          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
          />
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!email}
            className="w-full"
          >
            Soumettre la demande KYC
          </Button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
