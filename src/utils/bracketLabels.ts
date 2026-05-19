/**
 * Helper para extrair os rótulos customizados das séries/brackets do campeonato.
 * Todos os campos têm valores padrão caso o campeonato não tenha labels configurados.
 */
export interface BracketLabels {
    /** Ex: "Série Ouro" */
    gold: string;
    /** Ex: "Série Prata" */
    silver: string;
    /** Ex: "Grande Final" */
    finalLabel: string;
    /** Ex: "Disputa de 3º Lugar" */
    thirdPlaceLabel: string;
}

export function getBracketLabels(championship: any): BracketLabels {
    const raw = championship?.bracketLabels ?? {};
    return {
        gold: (raw as any).GOLD ?? 'Série Ouro',
        silver: (raw as any).SILVER ?? 'Série Prata',
        finalLabel: (raw as any).finalLabel ?? 'Grande Final',
        thirdPlaceLabel: (raw as any).thirdPlaceLabel ?? 'Disputa de 3º Lugar',
    };
}
