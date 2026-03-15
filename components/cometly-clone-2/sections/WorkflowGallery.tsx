"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

type WorkflowGalleryItem = {
  id: string;
  title: string;
  summary: string;
  actionLabel: string;
  url: string;
  image: string;
  imageClassName: string;
};

const GALLERY_ITEMS: WorkflowGalleryItem[] = [
  {
    id: "reservations",
    title: "Réservations sans friction",
    summary:
      "Créez le dossier de location rapidement : dates, véhicule, client, tarif, caution et options.",
    actionLabel: "Voir les réservations",
    url: "#",
    image: "/features/reservations sans friction.png",
    imageClassName: "object-center scale-[1.01]",
  },
  {
    id: "planning",
    title: "Planning sans conflit",
    summary:
      "Voyez les disponibilités instantanément et évitez les doubles réservations avant qu’elles n’arrivent.",
    actionLabel: "Voir le planning",
    url: "#",
    image: "/features/planning sans conflit.png",
    imageClassName: "object-center scale-[1.02]",
  },
  {
    id: "fleet",
    title: "Flotte maîtrisée",
    summary:
      "Suivez le statut, les documents, la maintenance et les échéances de chaque véhicule.",
    actionLabel: "Voir la flotte",
    url: "#",
    image: "/features/flotte maitrisee.png",
    imageClassName: "object-center scale-[1.015]",
  },
  {
    id: "payments",
    title: "Paiements et cautions sous contrôle",
    summary:
      "Suivez ce qui est payé, en attente, retenu ou à restituer.",
    actionLabel: "Voir les paiements",
    url: "#",
    image: "/features/paiemets et cautions.png",
    imageClassName: "object-center scale-[1.015]",
  },
  {
    id: "inspections",
    title: "Retours et inspections documentés",
    summary:
      "Ajoutez photos, dommages et décisions de caution pour réduire les litiges.",
    actionLabel: "Voir les inspections",
    url: "#",
    image: "/features/retous et inspections.png",
    imageClassName: "object-center scale-[1.015]",
  },
  {
    id: "priorities",
    title: "Priorités du jour en un coup d’œil",
    summary:
      "Commencez la journée avec les retours, retards, paiements et alertes déjà visibles.",
    actionLabel: "Voir le tableau de bord",
    url: "#",
    image: "/features/priorites du jour.png",
    imageClassName: "object-center scale-[1.015]",
  },
];

export function WorkflowGallery() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateSelection();
    carouselApi.on("select", updateSelection);
    carouselApi.on("reInit", updateSelection);

    return () => {
      carouselApi.off("select", updateSelection);
      carouselApi.off("reInit", updateSelection);
    };
  }, [carouselApi]);

  return (
    <section className="overflow-hidden bg-white py-20 md:py-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-8 md:mb-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[42px] md:leading-[1.14]">
              Voyez comment Locaryx simplifie la gestion de votre agence
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600 md:max-w-2xl md:text-base">
              De la réservation au retour du véhicule, chaque étape reste claire,
              suivie et plus simple à gérer.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="h-10 w-10 rounded-lg border-slate-200 bg-white text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Carte précédente</span>
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="h-10 w-10 rounded-lg border-slate-200 bg-white text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowRight className="h-5 w-5" />
              <span className="sr-only">Carte suivante</span>
            </Button>
          </div>
        </div>
      </div>

      <Carousel
        setApi={setCarouselApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
          breakpoints: {
            "(max-width: 768px)": {
              dragFree: true,
            },
          },
        }}
        className="relative left-[-1rem]"
      >
        <CarouselContent className="-mr-4 ml-8 2xl:ml-[max(8rem,calc(50vw-700px+1rem))] 2xl:mr-[max(0rem,calc(50vw-700px-1rem))]">
          {GALLERY_ITEMS.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-[88%] pl-4 sm:basis-[500px] lg:basis-[460px]"
            >
              <Link
                href={item.url}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card transition-colors duration-200 hover:border-slate-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-200 bg-slate-50">
                  <div className="absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-white/45 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-slate-950/8 to-transparent" />
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 500px, 460px"
                    className={`object-cover object-top transition-transform duration-300 group-hover:scale-[1.02] ${item.imageClassName}`}
                  />
                </div>

                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  <span>Workflow</span>
                  <span className="text-slate-400">Locaryx</span>
                </div>

                <div className="flex flex-1 flex-col px-5 py-5">
                  <h3 className="max-w-[14ch] text-[27px] font-semibold leading-[1.04] tracking-tight text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[33ch] text-[15px] leading-relaxed text-slate-600">
                    {item.summary}
                  </p>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
