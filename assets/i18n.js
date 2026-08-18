/* ClearJD translations.
 *
 * Every language object must carry the same set of keys. Keys are grouped as:
 *   page_*  chrome (title, hero, footer)
 *   l_*     form labels          ph_*  placeholders
 *   opt_*   toggle button labels
 *   doc_*   headings and field names in the generated job description
 *
 * To add a language: copy the `en` block, translate the values, and add a
 * button to the language toggle in index.html. Nothing else needs to change.
 */
'use strict';

const I18N = {

  en:{
    pageTitle:"ClearJD: job descriptions that lead with what matters",
    eyebrow:"OPEN-SOURCE JOB DESCRIPTION STANDARD",
    h1_pre:"Stop hiding", h1_post:"what candidates actually need to know.",
    sub:"Fill in the essentials and get a clean job description in seconds. No account, nothing sent anywhere.",

    examples_hint:"Or start from a worked example:",

    l_title:"Job title",
    s_essentials:"Essentials",

    l_stages_count:"How many interview stages?",
    l_stages:"What happens at each stage",
    hint_stages:"A candidate is deciding whether to spend their evenings on this. Tell them what they are signing up for.",
    ph_stage_what:"HR screening", ph_stage_minutes:"30",
    a11y_stage_what:"Stage {n}, what happens", a11y_stage_minutes:"Stage {n}, minutes",
    unit_minutes:"min",
    stage_one:"stage", stage_many:"stages",

    s_feedback:"Feedback", s_conditions:"Conditions",
    hint_feedback:"Being left in silence is the most common complaint candidates have. Committing to a number here costs you nothing and is remembered.",
    l_feedback:"You reply after each stage within",
    l_decision:"Final yes or no after the last stage within",
    workday_one:"working day", workday_many:"working days",
    feedback_each:"You hear back within {n} {u} of each stage.",
    feedback_final:"Final decision within {n} {u} of the last stage.",
    doc_feedback:"Feedback:",

    l_test:"Technical assessment",
    hint_test:"Live coding is done with you in a call. Take-home is unpaid work in their own time, so say how long it really takes.",
    opt_test_none:"None", opt_test_live:"Live coding",
    opt_test_home:"Take-home", opt_test_both:"Both",
    l_test_time:"Estimated time",
    opt_hours:"hours", opt_days:"days",
    hour_one:"hour", hour_many:"hours",

    l_mode:"Work mode",
    opt_remote:"100% remote", opt_hybrid:"Hybrid", opt_onsite:"On-site",
    l_days:"Minimum time on site",
    opt_per_week:"per week", opt_per_month:"per month",
    day_one:"day", day_many:"days",
    min_onsite:"Minimum on site:",

    l_tz:"Required timezone overlap", ph_tz:"At least 4h overlap with UTC+1",

    l_contract:"Contract type", l_contract_other:"Describe the contract type",
    ph_contract_other:"The name used in your country",
    contract_types:[
      { v:"permanent",      label:"Permanent",      short:"no end date",                     help:"Open-ended employment contract with no agreed end date." },
      { v:"fixed",          label:"Fixed-term",     short:"ends on an agreed date",           help:"Employment contract that ends on an agreed date." },
      { v:"b2b",            label:"B2B",            short:"you invoice, no employment rights", help:"You invoice through your own company. No employment rights, no paid leave, and you handle your own taxes and social security." },
      { v:"freelance",      label:"Freelance",      short:"you invoice as an individual",      help:"You invoice as an individual for agreed work. There is no employment relationship." },
      { v:"contractor",     label:"Contractor",     short:"employed by a third party",         help:"Employed by a third party and placed with the client for a set period." },
      { v:"internship",     label:"Internship",     short:"time-limited, tied to study",       help:"Time-limited position tied to training or study." },
      { v:"apprenticeship", label:"Apprenticeship", short:"work plus formal training",         help:"Paid role that combines work with formal training." },
      { v:"other",          label:"Other",          short:"",                                  help:"" },
    ],
    l_currency_other:"Currency code", ph_currency_other:"ISO code, for example SGD",
    opt_currency_other:"Other",

    l_bond:"Employment relationship",
    hint_bond:"Who signs the contract and pays the salary. Candidates want to know before stage one, not after.",
    opt_direct:"Direct with company", opt_agency:"Via staffing agency",
    l_client:"End client", ph_client:"Company name, or 'revealed at stage 2'",

    l_min:"Salary min", l_max:"Salary max", l_currency:"Currency",
    warn_salary:"The minimum is higher than the maximum.",
    range_to:"to",
    l_period:"Period", opt_year:"per year", opt_month:"per month", opt_hour:"per hour",

    l_benefits:"Benefits", ph_benefits:"Health insurance, meal allowance, training budget...",

    s_stack:"Tech stack",
    l_required:"Required", ph_required:"SQL, Snowflake, dbt",
    l_nice:"Nice to have", ph_nice:"Python, Airflow",

    s_expect:"What we expect from you",
    l_expect:"One line per point, no fluff",
    ph_expect:"Design and maintain reliable data pipelines\nDocument what you build",

    p_live:"Live preview",
    btn_copy:"Copy Markdown", btn_copied:"Copied ✓", btn_download:"Download .md",
    copy_failed:"Could not copy automatically. Select the preview and copy it manually.",

    contrib_title:"This is a community standard.",
    contrib_body:"Missing a field that matters in your country, or spotted something that reads badly? Open an issue or send a pull request.",
    contrib_btn:"Suggest a change",

    foot_left:"ClearJD is free and open source, built for job posts that lead with what matters.",
    foot_link:"View on GitHub →",
    foot_coffee:"Buy me a coffee",

    doc_essentials:"Essentials", doc_stack:"Tech stack", doc_expect:"What we expect from you",
    doc_stages:"Interview stages:", doc_test:"Technical assessment:",
    doc_mode:"Work mode:", doc_tz:"Required timezone overlap:",
    doc_contract:"Contract type:", doc_bond:"Employment relationship:",
    doc_salary:"Salary range (gross):", doc_benefits:"Benefits:",
    doc_req:"Required:", doc_nice:"Nice to have:",
    doc_title_ph:"[Job title]", empty:"not filled in yet",
    doc_footer:"Written with the [ClearJD](https://bonamim.github.io/clearjd/) job description template, v{v}.",
    bond_direct:"Direct with the company", bond_agency:"Via staffing agency, end client:",
    fallback_filename:"job-description",
  },

  pt:{
    pageTitle:"ClearJD: vagas que começam pelo que importa",
    eyebrow:"PADRÃO ABERTO DE DESCRIÇÃO DE VAGAS",
    h1_pre:"Para de esconder", h1_post:"o que os candidatos realmente precisam de saber.",
    sub:"Preenche os essenciais e recebe uma vaga limpa em segundos. Sem conta, nada é enviado para lado nenhum.",

    examples_hint:"Ou começa a partir de um exemplo preenchido:",

    l_title:"Título da vaga",
    s_essentials:"Essenciais",

    l_stages_count:"Quantas fases de entrevista?",
    l_stages:"O que acontece em cada fase",
    hint_stages:"O candidato está a decidir se vai gastar as noites dele nisto. Diz-lhe ao que vai.",
    ph_stage_what:"Screening RH", ph_stage_minutes:"30",
    a11y_stage_what:"Fase {n}, o que acontece", a11y_stage_minutes:"Fase {n}, minutos",
    unit_minutes:"min",
    stage_one:"fase", stage_many:"fases",

    s_feedback:"Resposta", s_conditions:"Condições",
    hint_feedback:"Ficar sem resposta é a queixa mais comum dos candidatos. Comprometeres-te com um número não te custa nada e fica na memória.",
    l_feedback:"Respondes depois de cada fase em",
    l_decision:"Resposta final depois da última fase em",
    workday_one:"dia útil", workday_many:"dias úteis",
    feedback_each:"Recebes resposta até {n} {u} depois de cada fase.",
    feedback_final:"Decisão final até {n} {u} depois da última fase.",
    doc_feedback:"Resposta:",

    l_test:"Avaliação técnica",
    hint_test:"Live coding é feito contigo numa call. Take-home é trabalho não pago no tempo dele, por isso diz quanto tempo demora mesmo.",
    opt_test_none:"Nenhuma", opt_test_live:"Live coding",
    opt_test_home:"Take-home", opt_test_both:"Ambas",
    l_test_time:"Tempo estimado",
    opt_hours:"horas", opt_days:"dias",
    hour_one:"hora", hour_many:"horas",

    l_mode:"Modalidade",
    opt_remote:"100% remoto", opt_hybrid:"Híbrido", opt_onsite:"Presencial",
    l_days:"Tempo mínimo presencial",
    opt_per_week:"por semana", opt_per_month:"por mês",
    day_one:"dia", day_many:"dias",
    min_onsite:"Mínimo presencial:",

    l_tz:"Sobreposição de fuso horário exigida", ph_tz:"Pelo menos 4h de sobreposição com UTC+1",

    l_contract:"Tipo de contrato", l_contract_other:"Descreve o tipo de contrato",
    ph_contract_other:"O nome usado no teu país",
    contract_types:[
      { v:"permanent",      label:"Sem termo",             short:"sem data de fim",                  help:"Contrato de trabalho sem data de fim acordada." },
      { v:"fixed",          label:"A termo",               short:"termina numa data acordada",       help:"Contrato de trabalho que termina numa data acordada." },
      { v:"b2b",            label:"B2B",                   short:"facturas, sem direitos laborais",  help:"Facturas através da tua própria empresa. Sem direitos laborais, sem férias pagas, e os impostos e a segurança social são da tua responsabilidade." },
      { v:"freelance",      label:"Freelancer",            short:"facturas como pessoa singular",    help:"Facturas como pessoa singular pelo trabalho acordado. Não existe vínculo laboral." },
      { v:"contractor",     label:"Prestação de serviços", short:"contratado por um terceiro",       help:"És contratado por um terceiro e colocado no cliente por um período definido." },
      { v:"internship",     label:"Estágio",               short:"limitado no tempo, ligado a estudos", help:"Posição limitada no tempo, ligada a formação ou a estudos." },
      { v:"apprenticeship", label:"Contrato de aprendizagem", short:"trabalho e formação formal",    help:"Função paga que combina trabalho com formação formal." },
      { v:"other",          label:"Outro",                 short:"",                                 help:"" },
    ],
    l_currency_other:"Código da moeda", ph_currency_other:"Código ISO, por exemplo SGD",
    opt_currency_other:"Outra",

    l_bond:"Vínculo contratual",
    hint_bond:"Quem assina o contrato e paga o salário. O candidato quer saber antes da primeira fase, não depois.",
    opt_direct:"Direto com a empresa", opt_agency:"Via consultora",
    l_client:"Cliente final", ph_client:"Nome da empresa, ou 'revelado na fase 2'",

    l_min:"Salário mín.", l_max:"Salário máx.", l_currency:"Moeda",
    warn_salary:"O mínimo é superior ao máximo.",
    range_to:"a",
    l_period:"Período", opt_year:"por ano", opt_month:"por mês", opt_hour:"por hora",

    l_benefits:"Benefícios", ph_benefits:"Seguro de saúde, subsídio de alimentação, orçamento de formação...",

    s_stack:"Tech stack",
    l_required:"Obrigatório", ph_required:"SQL, Snowflake, dbt",
    l_nice:"Bom ter", ph_nice:"Python, Airflow",

    s_expect:"O que esperamos de ti",
    l_expect:"Uma linha por ponto, sem lengalenga",
    ph_expect:"Desenhar e manter pipelines de dados fiáveis\nDocumentar o que constróis",

    p_live:"Pré-visualização",
    btn_copy:"Copiar Markdown", btn_copied:"Copiado ✓", btn_download:"Descarregar .md",
    copy_failed:"Não foi possível copiar automaticamente. Selecciona a pré-visualização e copia à mão.",

    contrib_title:"Isto é um padrão da comunidade.",
    contrib_body:"Falta um campo que importa no teu país, ou há alguma coisa mal escrita? Abre uma issue ou envia um pull request.",
    contrib_btn:"Sugerir uma alteração",

    foot_left:"ClearJD é gratuito e open source, feito para vagas que começam pelo que importa.",
    foot_link:"Ver no GitHub →",
    foot_coffee:"Oferece-me um café",

    doc_essentials:"Essenciais", doc_stack:"Tech stack", doc_expect:"O que esperamos de ti",
    doc_stages:"Fases de entrevista:", doc_test:"Avaliação técnica:",
    doc_mode:"Modalidade:", doc_tz:"Sobreposição de fuso horário exigida:",
    doc_contract:"Tipo de contrato:", doc_bond:"Vínculo contratual:",
    doc_salary:"Faixa salarial (bruto):", doc_benefits:"Benefícios:",
    doc_req:"Obrigatório:", doc_nice:"Bom ter:",
    doc_title_ph:"[Título da vaga]", empty:"por preencher",
    doc_footer:"Escrito com o template de vagas [ClearJD](https://bonamim.github.io/clearjd/), v{v}.",
    bond_direct:"Direto com a empresa", bond_agency:"Via consultora, cliente final:",
    fallback_filename:"descricao-de-vaga",
  },

  es:{
    pageTitle:"ClearJD: vacantes que empiezan por lo que importa",
    eyebrow:"ESTÁNDAR ABIERTO DE DESCRIPCIÓN DE PUESTOS",
    h1_pre:"Deja de esconder", h1_post:"lo que los candidatos realmente necesitan saber.",
    sub:"Completa lo esencial y obtén una descripción de puesto limpia en segundos. Sin cuenta, nada se envía a ningún sitio.",

    examples_hint:"O empieza desde un ejemplo completado:",

    l_title:"Título del puesto",
    s_essentials:"Esenciales",

    l_stages_count:"¿Cuántas fases de entrevista?",
    l_stages:"Qué ocurre en cada fase",
    hint_stages:"El candidato está decidiendo si dedicar sus tardes a esto. Dile a qué se apunta.",
    ph_stage_what:"Screening RRHH", ph_stage_minutes:"30",
    a11y_stage_what:"Fase {n}, qué ocurre", a11y_stage_minutes:"Fase {n}, minutos",
    unit_minutes:"min",
    stage_one:"fase", stage_many:"fases",

    s_feedback:"Respuesta", s_conditions:"Condiciones",
    hint_feedback:"Quedarse sin respuesta es la queja más común de los candidatos. Comprometerte con un número no te cuesta nada y se recuerda.",
    l_feedback:"Respondes después de cada fase en",
    l_decision:"Respuesta final después de la última fase en",
    workday_one:"día hábil", workday_many:"días hábiles",
    feedback_each:"Recibes respuesta en un máximo de {n} {u} tras cada fase.",
    feedback_final:"Decisión final en un máximo de {n} {u} tras la última fase.",
    doc_feedback:"Respuesta:",

    l_test:"Prueba técnica",
    hint_test:"El live coding se hace contigo en una llamada. El take-home es trabajo no pagado en su tiempo, así que di cuánto tarda de verdad.",
    opt_test_none:"Ninguna", opt_test_live:"Live coding",
    opt_test_home:"Take-home", opt_test_both:"Ambas",
    l_test_time:"Tiempo estimado",
    opt_hours:"horas", opt_days:"días",
    hour_one:"hora", hour_many:"horas",

    l_mode:"Modalidad",
    opt_remote:"100% remoto", opt_hybrid:"Híbrido", opt_onsite:"Presencial",
    l_days:"Tiempo mínimo presencial",
    opt_per_week:"por semana", opt_per_month:"por mes",
    day_one:"día", day_many:"días",
    min_onsite:"Mínimo presencial:",

    l_tz:"Solapamiento de huso horario requerido", ph_tz:"Al menos 4h de solapamiento con UTC+1",

    l_contract:"Tipo de contrato", l_contract_other:"Describe el tipo de contrato",
    ph_contract_other:"El nombre que se usa en tu país",
    contract_types:[
      { v:"permanent",      label:"Indefinido",              short:"sin fecha de fin",                 help:"Contrato de trabajo sin fecha de fin acordada." },
      { v:"fixed",          label:"Temporal",                short:"termina en una fecha acordada",    help:"Contrato de trabajo que termina en una fecha acordada." },
      { v:"b2b",            label:"B2B",                     short:"facturas, sin derechos laborales", help:"Facturas a través de tu propia empresa. Sin derechos laborales, sin vacaciones pagadas, y los impuestos y la seguridad social corren de tu cuenta." },
      { v:"freelance",      label:"Freelance",               short:"facturas como autónomo",           help:"Facturas como autónomo por el trabajo acordado. No hay relación laboral." },
      { v:"contractor",     label:"Prestación de servicios", short:"te contrata un tercero",           help:"Te contrata un tercero y te asigna al cliente durante un periodo definido." },
      { v:"internship",     label:"Prácticas",               short:"limitado en el tiempo, ligado a estudios", help:"Puesto limitado en el tiempo, vinculado a formación o estudios." },
      { v:"apprenticeship", label:"Contrato de formación",   short:"trabajo y formación reglada",      help:"Puesto remunerado que combina trabajo con formación reglada." },
      { v:"other",          label:"Otro",                    short:"",                                 help:"" },
    ],
    l_currency_other:"Código de la moneda", ph_currency_other:"Código ISO, por ejemplo SGD",
    opt_currency_other:"Otra",

    l_bond:"Relación laboral",
    hint_bond:"Quién firma el contrato y paga el salario. El candidato quiere saberlo antes de la primera fase, no después.",
    opt_direct:"Directo con la empresa", opt_agency:"Vía consultora",
    l_client:"Cliente final", ph_client:"Nombre de la empresa, o 'revelado en fase 2'",

    l_min:"Salario mín.", l_max:"Salario máx.", l_currency:"Moneda",
    warn_salary:"El mínimo es mayor que el máximo.",
    range_to:"a",
    l_period:"Periodo", opt_year:"por año", opt_month:"por mes", opt_hour:"por hora",

    l_benefits:"Beneficios", ph_benefits:"Seguro médico, ticket restaurante, presupuesto de formación...",

    s_stack:"Stack tecnológico",
    l_required:"Obligatorio", ph_required:"SQL, Snowflake, dbt",
    l_nice:"Deseable", ph_nice:"Python, Airflow",

    s_expect:"Qué esperamos de ti",
    l_expect:"Una línea por punto, sin relleno",
    ph_expect:"Diseñar y mantener pipelines de datos fiables\nDocumentar lo que construyes",

    p_live:"Vista previa",
    btn_copy:"Copiar Markdown", btn_copied:"Copiado ✓", btn_download:"Descargar .md",
    copy_failed:"No se pudo copiar automáticamente. Selecciona la vista previa y cópiala a mano.",

    contrib_title:"Esto es un estándar de la comunidad.",
    contrib_body:"¿Falta un campo que importa en tu país, o hay algo mal redactado? Abre una issue o envía un pull request.",
    contrib_btn:"Sugerir un cambio",

    foot_left:"ClearJD es gratuito y de código abierto, hecho para vacantes que empiezan por lo que importa.",
    foot_link:"Ver en GitHub →",
    foot_coffee:"Invítame a un café",

    doc_essentials:"Esenciales", doc_stack:"Stack tecnológico", doc_expect:"Qué esperamos de ti",
    doc_stages:"Fases de entrevista:", doc_test:"Prueba técnica:",
    doc_mode:"Modalidad:", doc_tz:"Solapamiento de huso horario requerido:",
    doc_contract:"Tipo de contrato:", doc_bond:"Relación laboral:",
    doc_salary:"Rango salarial (bruto):", doc_benefits:"Beneficios:",
    doc_req:"Obligatorio:", doc_nice:"Deseable:",
    doc_title_ph:"[Título del puesto]", empty:"sin completar",
    doc_footer:"Escrito con la plantilla de vacantes [ClearJD](https://bonamim.github.io/clearjd/), v{v}.",
    bond_direct:"Directo con la empresa", bond_agency:"Vía consultora, cliente final:",
    fallback_filename:"descripcion-de-puesto",
  },
};

/* Currency codes are not translated, so they live outside the language table. */
const CURRENCIES = [
  "EUR","USD","GBP","CHF","BRL","PLN","SEK","DKK","NOK",
  "CZK","RON","CAD","AUD","INR","MXN","ARS","ZAR","JPY",
];
