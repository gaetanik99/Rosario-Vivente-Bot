
export interface Mistero {
  nome: string;
  abbreviazione: string;
}

export const misteri: Mistero[] = [
  { nome: '1° Mistero Gioioso', abbreviazione: '1GI' },
  { nome: '2° Mistero Gioioso', abbreviazione: '2GI' },
  { nome: '3° Mistero Gioioso', abbreviazione: '3GI' },
  { nome: '4° Mistero Gioioso', abbreviazione: '4GI' },
  { nome: '5° Mistero Gioioso', abbreviazione: '5GI' },
  { nome: '1° Mistero della Luce', abbreviazione: '1LU' },
  { nome: '2° Mistero della Luce', abbreviazione: '2LU' },
  { nome: '3° Mistero della Luce', abbreviazione: '3LU' },
  { nome: '4° Mistero della Luce', abbreviazione: '4LU' },
  { nome: '5° Mistero della Luce', abbreviazione: '5LU' },
  { nome: '1° Mistero Doloroso', abbreviazione: '1DO' },
  { nome: '2° Mistero Doloroso', abbreviazione: '2DO' },
  { nome: '3° Mistero Doloroso', abbreviazione: '3DO' },
  { nome: '4° Mistero Doloroso', abbreviazione: '4DO' },
  { nome: '5° Mistero Doloroso', abbreviazione: '5DO' },
  { nome: '1° Mistero Glorioso', abbreviazione: '1GL' },
  { nome: '2° Mistero Glorioso', abbreviazione: '2GL' },
  { nome: '3° Mistero Glorioso', abbreviazione: '3GL' },
  { nome: '4° Mistero Glorioso', abbreviazione: '4GL' },
  { nome: '5° Mistero Glorioso', abbreviazione: '5GL' },
];

// Data di riferimento: 2 settembre 2025, partecipante 15, 3° GL (posizione 17)
const DATA_RIFERIMENTO = new Date('2025-09-02');
const POSIZIONE_RIFERIMENTO = 17;
const PARTECIPANTE_RIFERIMENTO = 15;

export function calcolaMisteroOggi(numeroPartecipante: number): Mistero {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  
  const riferimento = new Date(DATA_RIFERIMENTO);
  riferimento.setHours(0, 0, 0, 0);
  
  const diffTime = oggi.getTime() - riferimento.getTime();
  const giorniPassati = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const posizioneRiferimentoOggi = (POSIZIONE_RIFERIMENTO + giorniPassati) % 20;
  const offsetPartecipante = numeroPartecipante - PARTECIPANTE_RIFERIMENTO;
  
  let posizione = (posizioneRiferimentoOggi + offsetPartecipante) % 20;
  if (posizione < 0) posizione += 20;
  
  return misteri[posizione];
}

export function calcolaMisteroDomani(numeroPartecipante: number): Mistero {
  const domani = new Date();
  domani.setDate(domani.getDate() + 1);
  domani.setHours(0, 0, 0, 0);
  
  const riferimento = new Date(DATA_RIFERIMENTO);
  riferimento.setHours(0, 0, 0, 0);
  
  const diffTime = domani.getTime() - riferimento.getTime();
  const giorniPassati = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const posizioneRiferimentoOggi = (POSIZIONE_RIFERIMENTO + giorniPassati) % 20;
  const offsetPartecipante = numeroPartecipante - PARTECIPANTE_RIFERIMENTO;
  
  let posizione = (posizioneRiferimentoOggi + offsetPartecipante) % 20;
  if (posizione < 0) posizione += 20;
  
  return misteri[posizione];
}
