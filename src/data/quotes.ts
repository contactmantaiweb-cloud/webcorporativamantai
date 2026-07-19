export interface MotivationalQuote {
  text: string;
  author?: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    text: "El talento sin trabajo es solo una promesa incumplida.",
    author: ""
  },
  {
    text: "No temas empezar de nuevo. Esta vez no partes de cero, partes de la experiencia.",
    author: ""
  },
  {
    text: "Dios no llama a los capacitados; capacita a los llamados.",
    author: ""
  },
  {
    text: "El fracaso no es caer, es quedarte donde caíste pudiendo levantarte.",
    author: ""
  },
  {
    text: "Trabaja como si todo dependiera de ti, y confía como si todo dependiera de Dios.",
    author: ""
  },
  {
    text: "Lo que siembras con esfuerzo, la vida te lo devuelve con creces.",
    author: ""
  },
  {
    text: "No hay viento favorable para quien no sabe a dónde va.",
    author: ""
  },
  {
    text: "Los sueños se escriben con fe, pero se cumplen con disciplina.",
    author: ""
  },
  {
    text: "El que se rinde no sabe lo cerca que estaba de lograrlo.",
    author: ""
  },
  {
    text: "Las tormentas hacen a los árboles echar raíces más profundas.",
    author: ""
  },
  {
    text: "No pido una carga más liviana, sino una espalda más fuerte.",
    author: ""
  },
  {
    text: "Cada día que te esfuerzas, honras el potencial que te fue dado.",
    author: ""
  },
  {
    text: "Sé fiel en lo poco, y lo mucho llegará solo.",
    author: ""
  },
  {
    text: "La excelencia no es un acto, es una forma de honrar lo que hacés.",
    author: ""
  },
  {
    text: "El carácter se construye cuando nadie te está viendo.",
    author: ""
  }
];

export function getQuoteOfDay(): MotivationalQuote {
  const today = new Date();
  // Generate a stable daily hash based on Year, Month, and Date
  const dayHash = today.getFullYear() * 372 + today.getMonth() * 31 + today.getDate();
  const index = Math.abs(dayHash) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}
