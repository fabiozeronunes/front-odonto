export function Legal({ type }: { type: "privacidade" | "termos" }) {
  const isPrivacy = type === "privacidade";

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">
        {isPrivacy ? "Política de Privacidade" : "Termos de Uso"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: {new Date().getFullYear()}</p>

      <div className="prose mt-8 space-y-6 text-muted-foreground">
        {isPrivacy ? (
          <>
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Coleta de dados</h2>
              <p className="mt-2">
                Coletamos apenas os dados necessários para o funcionamento da plataforma: nome,
                e-mail e dados de acesso. Não solicitamos informações além das necessárias para a
                prestação do serviço (princípio da minimização de dados).
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Finalidade</h2>
              <p className="mt-2">
                Seus dados são utilizados exclusivamente para criar e gerenciar sua conta, garantir
                o acesso aos conteúdos contratados e melhorar sua experiência na plataforma.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Seus direitos (LGPD)</h2>
              <p className="mt-2">
                Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você pode solicitar
                acesso, correção e exclusão dos seus dados pessoais a qualquer momento. Para
                solicitar a exclusão da conta, entre em contato com o suporte.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Segurança</h2>
              <p className="mt-2">
                Utilizamos senhas com hash seguro, autenticação por token e boas práticas de
                segurança para proteger suas informações contra acessos não autorizados.
              </p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 className="text-xl font-semibold text-foreground">1. Aceitação</h2>
              <p className="mt-2">
                Ao criar uma conta na plataforma FrontOdontus, você concorda com estes Termos de Uso
                e com a Política de Privacidade.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Conta</h2>
              <p className="mt-2">
                Você é responsável por manter a confidencialidade das suas credenciais de acesso e
                por todas as atividades realizadas na sua conta.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Planos e assinaturas</h2>
              <p className="mt-2">
                O plano gratuito oferece acesso a conteúdos gratuitos. O plano premium oferece acesso
                completo aos conteúdos exclusivos, conforme descrito na página de planos.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Conteúdo</h2>
              <p className="mt-2">
                Os vídeos e materiais são destinados exclusivamente a fins educacionais e não
                substituem orientação profissional. A redistribuição sem autorização é proibida.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
