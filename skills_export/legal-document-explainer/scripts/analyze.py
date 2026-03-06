def analyze_clauses(text):
    """
    Função mock que simularia a extração de cláusulas de um texto jurídico.
    Na prática, o LLM vai resolver isso, mas o script pode ajudar a quebrar PDFs longos.
    """
    danger_keywords = ["renovação automática", "multa diária", "renúncia de foro", "isenção de responsabilidade"]
    found = [kw for kw in danger_keywords if kw in text.lower()]
    return {
        "risk_level": "Alto" if len(found) > 2 else ("Médio" if len(found) > 0 else "Baixo"),
        "flags": found
    }
