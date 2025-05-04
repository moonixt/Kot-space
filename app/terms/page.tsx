import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="flex justify-center min-h-screen p-4 ">
            <Link href="/">
            <p>
                Back
            </p>
            </Link>
        <div className="max-w-7xl ">
            <div className="text-4xl text-[var(--foreground)] bg-[var(--theme)] mt-5 mb-2 ">
            Terms of Service
            </div>
            <div className="bg-[var(--container)] text-[var(--foreground)] rounded p-6 shadow">
                <h2 className="text-xl font-bold mb-2">1. Aceitação dos Termos</h2>
                <p className="mb-4">Ao acessar ou utilizar este aplicativo, você concorda com estes Termos de Uso. Caso não concorde, por favor, não utilize o serviço.</p>
                <h2 className="text-xl font-bold mb-2">2. Uso Permitido</h2>
                <p className="mb-4">É estritamente proibido utilizar o aplicativo para criar, armazenar, compartilhar ou divulgar conteúdo adulto, impróprio, ilegal, ofensivo, discriminatório ou que viole direitos de terceiros.</p>
                <h2 className="text-xl font-bold mb-2">3. Responsabilidade do Usuário</h2>
                <p className="mb-4">O usuário é o único responsável pelo conteúdo inserido, compartilhado ou armazenado no aplicativo. O uso inadequado pode resultar em suspensão ou exclusão da conta.</p>
                <h2 className="text-xl font-bold mb-2">4. Limitação de Responsabilidade</h2>
                <p className="mb-4">O aplicativo é fornecido "como está". Não nos responsabilizamos por perdas, danos, prejuízos, indisponibilidade, falhas, exclusão de dados ou qualquer consequência decorrente do uso ou da impossibilidade de uso do aplicativo, incluindo conteúdos publicados por usuários.</p>
                <h2 className="text-xl font-bold mb-2">5. Privacidade</h2>
                <p className="mb-4">Seus dados serão tratados conforme nossa Política de Privacidade. Recomendamos a leitura atenta desse <Link href="/privacy" className="border-b text-blue-500">documento. </Link></p>
                <h2 className="text-xl font-bold mb-2">6. Modificações dos Termos</h2>
                <p className="mb-4">Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento, sem aviso prévio. As alterações entrarão em vigor a partir da publicação nesta página.</p>
                <h2 className="text-xl font-bold mb-2">7. Contato</h2>
                <p>Em caso de dúvidas, entre em contato pelo e-mail de suporte informado no aplicativo.</p>
            </div>
        </div>
        </div>
    );
}