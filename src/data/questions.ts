/**
 * Fernanda's three question groups, transcribed from
 * `fernanda-questions-multilingual.md`.
 *
 * Each group holds 8 seeds. A play session draws 5 unique IDs
 * (`PLAY_QUESTIONS_PER_GROUP`) and keeps them for resume, language switches,
 * and results.
 *
 * `correctIndex` is 0-based and shared by all four locales, so the option order
 * must stay identical across es/en/fr/de when editing.
 */
import type { Locale, Question } from '../types';

interface LocalizedQuestion {
  text: string;
  options: [string, string, string, string];
}

export interface QuestionSeed {
  id: string;
  /** 0-based index into `options`. Shared across every locale. */
  correctIndex: number;
  i18n: Record<Locale, LocalizedQuestion>;
}

const GROUP_1: QuestionSeed[] = [
  {
    id: 'g1q1',
    correctIndex: 2,
    i18n: {
      es: {
        text: '¿Cuánto tiempo esperó Hector a Fer en su primera cita?',
        options: [
          'entre 5 a 10 minutos',
          'entre 11 a 15 minutos',
          'entre 16 a 20 minutos',
          'más de 20 minutos (entró a una tienda para hacer tiempo)',
        ],
      },
      en: {
        text: 'How long did Hector wait for Fer on their first date?',
        options: [
          '5 to 10 minutes',
          '11 to 15 minutes',
          '16 to 20 minutes',
          'more than 20 minutes (he went into a store to kill time)',
        ],
      },
      fr: {
        text: 'Combien de temps Hector a-t-il attendu Fer lors de leur premier rendez-vous ?',
        options: [
          'entre 5 et 10 minutes',
          'entre 11 et 15 minutes',
          'entre 16 et 20 minutes',
          "plus de 20 minutes (il est entré dans un magasin pour patienter)",
        ],
      },
      de: {
        text: 'Wie lange hat Hector beim ersten Date auf Fer gewartet?',
        options: [
          '5 bis 10 Minuten',
          '11 bis 15 Minuten',
          '16 bis 20 Minuten',
          'mehr als 20 Minuten (er ging in ein Geschäft, um die Zeit zu überbrücken)',
        ],
      },
    },
  },
  {
    id: 'g1q2',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿De qué color fue la primera moto de Hector?',
        options: ['Roja', 'Azul', 'Negra', 'Blanca'],
      },
      en: {
        text: "What color was Hector's first motorcycle?",
        options: ['Red', 'Blue', 'Black', 'White'],
      },
      fr: {
        text: 'De quelle couleur était la première moto de Hector ?',
        options: ['Rouge', 'Bleue', 'Noire', 'Blanche'],
      },
      de: {
        text: 'Welche Farbe hatte Hectors erstes Motorrad?',
        options: ['Rot', 'Blau', 'Schwarz', 'Weiß'],
      },
    },
  },
  {
    id: 'g1q3',
    correctIndex: 0,
    i18n: {
      es: {
        text: '¿Cuántos idiomas tiene la flor de loto 3d con la que Hector le pidió que fuera su novia a Fer?',
        options: ['13', '15', '17', 'Solo 1: el idioma es el del amor'],
      },
      en: {
        text: 'How many languages does the 3D lotus flower Hector used to ask Fer to be his girlfriend have?',
        options: ['13', '15', '17', 'Just 1 — the language of love'],
      },
      fr: {
        text: 'Combien de langues comporte la fleur de lotus 3D avec laquelle Hector a demandé à Fer de sortir avec lui ?',
        options: ['13', '15', '17', "Une seule : la langue de l'amour"],
      },
      de: {
        text: 'Wie viele Sprachen hat die 3D-Lotusblume, mit der Hector Fer gefragt hat, ob sie seine Freundin sein möchte?',
        options: ['13', '15', '17', 'Nur 1 — die Sprache der Liebe'],
      },
    },
  },
  {
    id: 'g1q4',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿Cuántos vuelos de Dublín-Düsseldorf han tomado sumados entre Hector y Fer?',
        options: ['8', '10', '12', '16'],
      },
      en: {
        text: 'How many Dublin–Düsseldorf flights have Hector and Fer taken combined?',
        options: ['8', '10', '12', '16'],
      },
      fr: {
        text: 'Combien de vols Dublin-Düsseldorf Hector et Fer ont-ils pris au total ?',
        options: ['8', '10', '12', '16'],
      },
      de: {
        text: 'Wie viele Flüge Dublin–Düsseldorf haben Hector und Fer zusammen genommen?',
        options: ['8', '10', '12', '16'],
      },
    },
  },
  {
    id: 'g1q5',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿Cuál fue el primer país al que Hector viajó fuera de México?',
        options: ['Colombia', 'USA', 'Costa Rica', 'China'],
      },
      en: {
        text: 'What was the first country Hector traveled to outside of Mexico?',
        options: ['Colombia', 'USA', 'Costa Rica', 'China'],
      },
      fr: {
        text: 'Quel a été le premier pays où Hector a voyagé en dehors du Mexique ?',
        options: ['Colombie', 'États-Unis', 'Costa Rica', 'Chine'],
      },
      de: {
        text: 'Welches war das erste Land, in das Hector außerhalb von Mexiko gereist ist?',
        options: ['Kolumbien', 'USA', 'Costa Rica', 'China'],
      },
    },
  },
  {
    id: 'g1q6',
    correctIndex: 2,
    i18n: {
      es: {
        text: '¿En qué año Hector se tituló de ingeniero?',
        options: ['2018', '2019', '2020', '2021'],
      },
      en: {
        text: 'In what year did Hector graduate as an engineer?',
        options: ['2018', '2019', '2020', '2021'],
      },
      fr: {
        text: "En quelle année Hector a-t-il obtenu son diplôme d'ingénieur ?",
        options: ['2018', '2019', '2020', '2021'],
      },
      de: {
        text: 'In welchem Jahr hat Hector sein Ingenieurstudium abgeschlossen?',
        options: ['2018', '2019', '2020', '2021'],
      },
    },
  },
  {
    id: 'g1q7',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿A qué edad Hector tuvo su primer coche?',
        options: ['17', '18', '19', '21'],
      },
      en: {
        text: 'At what age did Hector get his first car?',
        options: ['17', '18', '19', '21'],
      },
      fr: {
        text: 'À quel âge Hector a-t-il eu sa première voiture ?',
        options: ['17 ans', '18 ans', '19 ans', '21 ans'],
      },
      de: {
        text: 'In welchem Alter bekam Hector sein erstes Auto?',
        options: ['17', '18', '19', '21'],
      },
    },
  },
  {
    id: 'g1q8',
    correctIndex: 2,
    i18n: {
      es: {
        text: '¿Cuántas fotos diferentes hay en el álbum que le regaló Hector a Fer (al momento)?',
        options: ['58', '76', '90', '110'],
      },
      en: {
        text: 'How many different photos are in the album Hector gave Fer (so far)?',
        options: ['58', '76', '90', '110'],
      },
      fr: {
        text: "Combien de photos différentes contient l'album que Hector a offert à Fer (pour l'instant) ?",
        options: ['58', '76', '90', '110'],
      },
      de: {
        text: 'Wie viele verschiedene Fotos enthält das Album, das Hector Fer geschenkt hat (bisher)?',
        options: ['58', '76', '90', '110'],
      },
    },
  },
];

const GROUP_2: QuestionSeed[] = [
  {
    id: 'g2q1',
    correctIndex: 3,
    i18n: {
      es: { text: '¿Cuántos tatuajes tiene Hector?', options: ['25', '22', '21', '20'] },
      en: { text: 'How many tattoos does Hector have?', options: ['25', '22', '21', '20'] },
      fr: { text: 'Combien de tatouages Hector a-t-il ?', options: ['25', '22', '21', '20'] },
      de: { text: 'Wie viele Tattoos hat Hector?', options: ['25', '22', '21', '20'] },
    },
  },
  {
    id: 'g2q2',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿Cuántas veces les aplaudieron en Dublín en sus primeros besos en público?',
        options: ['2', '3', '4', '5'],
      },
      en: {
        text: 'How many times did people applaud them in Dublin during their first public kisses?',
        options: ['2', '3', '4', '5'],
      },
      fr: {
        text: 'Combien de fois les a-t-on applaudis à Dublin lors de leurs premiers baisers en public ?',
        options: ['2', '3', '4', '5'],
      },
      de: {
        text: 'Wie oft wurde ihnen in Dublin bei ihren ersten Küssen in der Öffentlichkeit applaudiert?',
        options: ['2', '3', '4', '5'],
      },
    },
  },
  {
    id: 'g2q3',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿Cuál fue el primer instrumento que aprendió a tocar Hector?',
        options: ['Ukulele', 'Flauta', 'Guitarra', 'Batería'],
      },
      en: {
        text: 'What was the first instrument Hector learned to play?',
        options: ['Ukulele', 'Flute', 'Guitar', 'Drums'],
      },
      fr: {
        text: 'Quel a été le premier instrument que Hector a appris à jouer ?',
        options: ['Ukulélé', 'Flûte', 'Guitare', 'Batterie'],
      },
      de: {
        text: 'Welches Instrument hat Hector zuerst spielen gelernt?',
        options: ['Ukulele', 'Flöte', 'Gitarre', 'Schlagzeug'],
      },
    },
  },
  {
    id: 'g2q4',
    correctIndex: 0,
    i18n: {
      es: {
        text: '¿Con qué número de playera Hector jugaba fútbol la mayor parte de su vida?',
        options: ['7', '10', '11', '96'],
      },
      en: {
        text: 'What jersey number did Hector wear playing soccer for most of his life?',
        options: ['7', '10', '11', '96'],
      },
      fr: {
        text: 'Quel numéro de maillot Hector portait-il en jouant au football la majeure partie de sa vie ?',
        options: ['7', '10', '11', '96'],
      },
      de: {
        text: 'Welche Trikotnummer trug Hector die meiste Zeit seines Lebens beim Fußballspielen?',
        options: ['7', '10', '11', '96'],
      },
    },
  },
  {
    id: 'g2q5',
    correctIndex: 2,
    i18n: {
      es: {
        text: '¿Qué día de la semana fue su primer beso?',
        options: ['Viernes', 'Sábado', 'Domingo', 'Lunes'],
      },
      en: {
        text: 'What day of the week was their first kiss?',
        options: ['Friday', 'Saturday', 'Sunday', 'Monday'],
      },
      fr: {
        text: 'Quel jour de la semaine a eu lieu leur premier baiser ?',
        options: ['Vendredi', 'Samedi', 'Dimanche', 'Lundi'],
      },
      de: {
        text: 'An welchem Wochentag war ihr erster Kuss?',
        options: ['Freitag', 'Samstag', 'Sonntag', 'Montag'],
      },
    },
  },
  {
    id: 'g2q6',
    correctIndex: 3,
    i18n: {
      es: {
        text: '¿Cuántos legos de Spiderman le regaló Fer a Hector?',
        options: ['12', '16', '18', '20'],
      },
      en: {
        text: 'How many Spiderman Lego sets did Fer give Hector?',
        options: ['12', '16', '18', '20'],
      },
      fr: {
        text: 'Combien de Lego Spiderman Fer a-t-elle offerts à Hector ?',
        options: ['12', '16', '18', '20'],
      },
      de: {
        text: 'Wie viele Spiderman-Legos hat Fer Hector geschenkt?',
        options: ['12', '16', '18', '20'],
      },
    },
  },
  {
    id: 'g2q7',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿Cuántas postales le ha mandado Fer a Hector por correo?',
        options: ['12', '15', '18', '21'],
      },
      en: {
        text: 'How many postcards has Fer sent Hector by mail?',
        options: ['12', '15', '18', '21'],
      },
      fr: {
        text: 'Combien de cartes postales Fer a-t-elle envoyées à Hector par courrier ?',
        options: ['12', '15', '18', '21'],
      },
      de: {
        text: 'Wie viele Postkarten hat Fer Hector per Post geschickt?',
        options: ['12', '15', '18', '21'],
      },
    },
  },
  {
    id: 'g2q8',
    correctIndex: 2,
    i18n: {
      es: {
        text: '¿Cuál es la película animada favorita de Hector?',
        options: ['Tierra de osos', 'Nemo', 'El rey León', 'Atlantis'],
      },
      en: {
        text: "What is Hector's favorite animated movie?",
        options: ['Open Season', 'Nemo', 'The Lion King', 'Atlantis'],
      },
      fr: {
        text: "Quel est le film d'animation préféré de Hector ?",
        options: ['Open Season', 'Nemo', 'Le Roi Lion', 'Atlantis'],
      },
      de: {
        text: 'Was ist Hectors Lieblings-Animationsfilm?',
        options: ['Open Season', 'Nemo', 'Der König der Löwen', 'Atlantis'],
      },
    },
  },
];

const GROUP_3: QuestionSeed[] = [
  {
    id: 'g3q1',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿Cuántos primos del lado materno tiene Hector?',
        options: ['7', '9', '11', '15'],
      },
      en: {
        text: "How many cousins does Hector have on his mother's side?",
        options: ['7', '9', '11', '15'],
      },
      fr: {
        text: 'Combien de cousins Hector a-t-il du côté maternel ?',
        options: ['7', '9', '11', '15'],
      },
      de: {
        text: 'Wie viele Cousins und Cousinen hat Hector mütterlicherseits?',
        options: ['7', '9', '11', '15'],
      },
    },
  },
  {
    id: 'g3q2',
    correctIndex: 2,
    i18n: {
      es: {
        text: '¿Cuál es el pin favorito de Hector que le ha regalado Fer?',
        options: [
          'El queso de Francia',
          'Los limones de Italia',
          'El de la obra de Hercules',
          'El RedBus de Londres',
        ],
      },
      en: {
        text: "What is Hector's favorite pin that Fer has given him?",
        options: [
          'The cheese from France',
          'The lemons from Italy',
          'The Hercules musical one',
          'The London red bus',
        ],
      },
      fr: {
        text: "Quel est le pin's préféré de Hector offert par Fer ?",
        options: [
          'Le fromage de France',
          "Les citrons d'Italie",
          'Celui de la comédie musicale Hercule',
          'Le bus rouge de Londres',
        ],
      },
      de: {
        text: 'Welches ist Hectors Lieblings-Pin, den Fer ihm geschenkt hat?',
        options: [
          'Der Käse aus Frankreich',
          'Die Zitronen aus Italien',
          'Der vom Hercules-Musical',
          'Der rote Londoner Bus',
        ],
      },
    },
  },
  {
    id: 'g3q3',
    correctIndex: 2,
    i18n: {
      es: {
        text: '¿A qué edad Hector se hizo su primer tatuaje?',
        options: ['21', '22', '23', '24'],
      },
      en: {
        text: 'At what age did Hector get his first tattoo?',
        options: ['21', '22', '23', '24'],
      },
      fr: {
        text: "À quel âge Hector s'est-il fait son premier tatouage ?",
        options: ['21 ans', '22 ans', '23 ans', '24 ans'],
      },
      de: {
        text: 'In welchem Alter hat sich Hector sein erstes Tattoo stechen lassen?',
        options: ['21', '22', '23', '24'],
      },
    },
  },
  {
    id: 'g3q4',
    correctIndex: 3,
    i18n: {
      es: {
        text: '¿De qué color es el coche del papá de Hector que les prestó para moverse en Toluca?',
        options: ['Azul', 'Rojo', 'Blanco', 'Gris'],
      },
      en: {
        text: "What color is Hector's dad's car that he lent them to get around in Toluca?",
        options: ['Blue', 'Red', 'White', 'Gray'],
      },
      fr: {
        text: 'De quelle couleur est la voiture du père de Hector qu’il leur a prêtée pour se déplacer à Toluca ?',
        options: ['Bleue', 'Rouge', 'Blanche', 'Grise'],
      },
      de: {
        text: 'Welche Farbe hat das Auto von Hectors Vater, das er ihnen geliehen hat, um sich in Toluca fortzubewegen?',
        options: ['Blau', 'Rot', 'Weiß', 'Grau'],
      },
    },
  },
  {
    id: 'g3q5',
    correctIndex: 0,
    i18n: {
      es: {
        text: '¿Cuál es la pizza favorita de Hector?',
        options: ['Peperoni', 'Nduja', 'Champiñones', '3 quesos'],
      },
      en: {
        text: "What is Hector's favorite pizza?",
        options: ['Pepperoni', 'Nduja', 'Mushroom', 'Three cheese'],
      },
      fr: {
        text: 'Quelle est la pizza préférée de Hector ?',
        options: ['Pepperoni', 'Nduja', 'Champignons', 'Trois fromages'],
      },
      de: {
        text: 'Was ist Hectors Lieblingspizza?',
        options: ['Peperoni', 'Nduja', 'Champignon', 'Drei-Käse'],
      },
    },
  },
  {
    id: 'g3q6',
    correctIndex: 1,
    i18n: {
      es: {
        text: '¿Cuántas veces han viajado en avión juntos?',
        options: ['1', '2', '3', 'Ninguna porque Hector se la pasó durmiendo'],
      },
      en: {
        text: 'How many times have they traveled together by plane?',
        options: ['1', '2', '3', 'None, because Hector slept through every one'],
      },
      fr: {
        text: 'Combien de fois ont-ils voyagé ensemble en avion ?',
        options: ['1', '2', '3', "Aucune, parce qu'Hector a dormi tout le trajet"],
      },
      de: {
        text: 'Wie oft sind sie zusammen geflogen?',
        options: ['1', '2', '3', 'Keinmal, weil Hector die ganze Zeit geschlafen hat'],
      },
    },
  },
  {
    id: 'g3q7',
    correctIndex: 2,
    i18n: {
      es: {
        text: '¿Cuáles son los boxers favoritos de Hector?',
        options: [
          'Los de Bob Esponja',
          'Los de tacos',
          'Los patitos irlandeses',
          'Prefiere estar sin boxers',
        ],
      },
      en: {
        text: "What are Hector's favorite boxers?",
        options: [
          'The SpongeBob ones',
          'The taco ones',
          'The Irish ducklings',
          'He prefers no boxers at all',
        ],
      },
      fr: {
        text: "Quel est le caleçon préféré de Hector ?",
        options: [
          "Celui à motif Bob l'éponge",
          'Celui à motif tacos',
          'Celui aux canetons irlandais',
          'Il préfère ne pas en porter',
        ],
      },
      de: {
        text: 'Welches sind Hectors Lieblingsboxershorts?',
        options: [
          'Die mit SpongeBob',
          'Die mit Tacos',
          'Die mit den irischen Entchen',
          'Er trägt lieber gar keine',
        ],
      },
    },
  },
  {
    id: 'g3q8',
    correctIndex: 3,
    i18n: {
      es: {
        text: '¿Cuántos kilómetros hay en línea recta desde donde vive Hector en Münster hasta donde vive Fer en Dublín?',
        options: ['697.15', '734.23', '826.34', '947.52'],
      },
      en: {
        text: 'How many kilometers in a straight line separate where Hector lives in Münster from where Fer lives in Dublin?',
        options: ['697.15', '734.23', '826.34', '947.52'],
      },
      fr: {
        text: "Combien de kilomètres en ligne droite séparent l'endroit où vit Hector à Münster de celui où vit Fer à Dublin ?",
        options: ['697,15', '734,23', '826,34', '947,52'],
      },
      de: {
        text: 'Wie viele Kilometer Luftlinie liegen zwischen Hectors Wohnort in Münster und Fers Wohnort in Dublin?',
        options: ['697,15', '734,23', '826,34', '947,52'],
      },
    },
  },
];

export const QUESTION_GROUPS: Record<'1' | '2' | '3', QuestionSeed[]> = {
  '1': GROUP_1,
  '2': GROUP_2,
  '3': GROUP_3,
};

export const PLAY_QUESTIONS_PER_GROUP = 5;

export function getGroupQuestions(groupId: '1' | '2' | '3', locale: Locale): Question[] {
  return QUESTION_GROUPS[groupId].map((seed) => ({
    id: seed.id,
    text: seed.i18n[locale].text,
    options: [...seed.i18n[locale].options],
    correctIndex: seed.correctIndex,
  }));
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Unique random draw of 5 IDs from a group's 8 seeds. */
export function pickPlayQuestionIds(groupId: '1' | '2' | '3'): string[] {
  return shuffleIds(QUESTION_GROUPS[groupId].map((seed) => seed.id)).slice(
    0,
    PLAY_QUESTIONS_PER_GROUP,
  );
}

/**
 * Resolve stored IDs to the current locale, preserving play order.
 * Already-answered IDs stay first so a mid-group resume never repeats them.
 */
export function ensurePlayQuestionIds(
  groupId: '1' | '2' | '3',
  existingIds: string[] | undefined,
  answeredIds: string[] = [],
): string[] {
  if (
    existingIds &&
    existingIds.length === PLAY_QUESTIONS_PER_GROUP &&
    new Set(existingIds).size === PLAY_QUESTIONS_PER_GROUP
  ) {
    return existingIds;
  }

  const uniqueAnswered = [...new Set(answeredIds)];
  if (uniqueAnswered.length >= PLAY_QUESTIONS_PER_GROUP) {
    return uniqueAnswered.slice(0, PLAY_QUESTIONS_PER_GROUP);
  }

  const remaining = shuffleIds(
    QUESTION_GROUPS[groupId]
      .map((seed) => seed.id)
      .filter((id) => !uniqueAnswered.includes(id)),
  );

  return [...uniqueAnswered, ...remaining].slice(0, PLAY_QUESTIONS_PER_GROUP);
}

export function questionsForIds(
  groupId: '1' | '2' | '3',
  locale: Locale,
  ids: string[],
): Question[] {
  const byId = new Map(getGroupQuestions(groupId, locale).map((question) => [question.id, question]));
  const seen = new Set<string>();
  return ids.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const question = byId.get(id);
    return question ? [question] : [];
  });
}

/** Group 3 closes with the untimed, unscored map question. */
export const GROUP_WITH_BONUS = '3' as const;

export const HECTOR_HOME_COORDS = {
  lat: 51.93828946997965,
  lng: 7.591595632371097,
} as const;
