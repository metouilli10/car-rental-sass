"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const faqs = [
  {
    question: "Est-ce que Locaryx est difficile a prendre en main ?",
    answer:
      "Non. Locaryx est concu pour les agences de location qui veulent centraliser leur gestion sans formation technique lourde. L'interface reste simple des la premiere utilisation.",
  },
  {
    question: "Puis-je gerer mes reservations et mes vehicules au meme endroit ?",
    answer:
      "Oui. Reservations, calendrier de disponibilite, flotte, clients, paiements et cautions sont centralises dans une seule plateforme.",
  },
  {
    question: "Locaryx fonctionne-t-il sur mobile et tablette ?",
    answer:
      "Oui. Vous pouvez acceder a Locaryx depuis un ordinateur, une tablette ou un telephone pour suivre l'activite de votre agence a tout moment.",
  },
  {
    question: "Est-ce adapte aux petites agences de location ?",
    answer:
      "Oui. L'offre Starter est pensee pour les petites flottes, avec les outils essentiels pour gerer les reservations, les clients et les paiements sans complexite inutile.",
  },
  {
    question: "Mes donnees clients et mes documents sont-ils securises ?",
    answer:
      "Oui. Les informations de votre agence sont hebergees de maniere securisee et organisees pour que votre equipe puisse les retrouver rapidement sans passer par plusieurs outils.",
  },
  {
    question: "Puis-je changer d'offre plus tard ?",
    answer:
      "Oui. Vous pouvez passer a une offre superieure ou ajuster votre abonnement en fonction de la taille de votre flotte et de l'evolution de votre agence.",
  },
];

export function FAQAccordionBlock() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="w-full bg-gradient-to-b from-background to-muted/30 px-4 py-20 md:py-24"
    >
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={false}
          className="mb-12 text-center md:mb-16"
        >
          <Badge className="mb-4" variant="secondary">
            <HelpCircle className="mr-1 h-3 w-3" />
            FAQ
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Questions frequentes
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Voici les reponses aux questions les plus courantes avant de lancer
            Locaryx dans votre agence.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={faq.question}
                initial={false}
              >
                <Card className="overflow-hidden border-border/50 bg-card transition-all hover:border-primary/40 hover:shadow-md">
                  <motion.button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-4 text-left md:p-6"
                    whileHover={{ backgroundColor: "rgba(37,99,235,0.03)" }}
                  >
                    <span className="pr-4 text-base font-semibold md:text-lg">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 p-4 md:p-6">
                          <motion.p
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            className="text-sm text-muted-foreground md:text-base"
                          >
                            {faq.answer}
                          </motion.p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={false}
          className="mt-12 text-center md:mt-16"
        >
          <Card className="border-border/50 bg-gradient-to-br from-card to-muted/30 p-6 md:p-8">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-bold md:text-2xl">
              Vous avez encore des questions ?
            </h3>
            <p className="mb-6 text-sm text-muted-foreground md:text-base">
              Notre equipe peut vous aider a choisir l&apos;offre adaptee a votre
              flotte et a votre organisation.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg">Contacter l&apos;equipe</Button>
              <Button size="lg" variant="outline">
                commancer gratuitements
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
