/* Filled-in examples.
 *
 * These are the single source of truth for the example job posts. The page
 * loads them into the form, and `npm run examples` renders the same data into
 * the Markdown files under examples/. A test fails if the two ever drift, so
 * the files on disk always match what the generator actually produces.
 *
 * Each entry is for one document: `doc:'card'` for a candidate card, the job
 * description otherwise. Job descriptions keep their interview stages in
 * `stages`, candidate cards their technologies in `techs`.
 *
 * To add one: append an entry here, run `npm run examples`, commit both.
 * Pick a combination that is not covered yet (a different market, contract
 * type or employment relationship) so the set keeps stress-testing the
 * template rather than repeating it.
 */
'use strict';

const EXAMPLES = [

  {
    id:'data-engineer-portugal',
    stages:[
      { what:'HR screening',                             minutes:'30' },
      { what:'Technical, with a SQL and modelling exercise', minutes:'60' },
      { what:'Team fit with the data team',              minutes:'45' },
    ],
    label:'Data Engineer, Portugal',
    note:'Hybrid, permanent, hired directly',
    lang:'en',
    state:{ test:'none', mode:'hybrid', daysUnit:'week', bond:'direct', period:'year' },
    fields:{
      f_title:'Data Engineer (Snowflake)',
      f_feedback_days:'5', f_decision_days:'10',
      f_days:'2',
      f_tz:'At least 4h overlap with UTC',
      f_contract:'permanent',
      f_min:'32000', f_max:'42000', f_currency:'EUR',
      f_benefits:'Health insurance, meal allowance on card, annual training budget of 500 EUR, flexible hours',
      f_required:'Advanced SQL, Snowflake or another cloud data warehouse (BigQuery, Redshift), dbt or equivalent',
      f_nice:'Python, Airflow, data governance experience',
      f_expect:[
        'Design and maintain data pipelines that stay reliable, not ones that work once',
        'Document what you build, because other people will depend on it',
        'Discuss modelling trade-offs with people who are not engineers',
        'Have run a cloud data warehouse in production, not only in a course',
      ].join('\n'),
    },
  },

  {
    id:'backend-engineer-b2b-poland',
    stages:[
      { what:'Technical screening with the engineering lead', minutes:'45' },
      { what:'System design and team fit',                    minutes:'90' },
    ],
    label:'Backend Engineer, Poland',
    note:'Remote, B2B, through a staffing agency',
    lang:'en',
    state:{ test:'home', testUnit:'hours', mode:'remote', bond:'agency', period:'hour' },
    fields:{
      f_title:'Senior Backend Engineer (Go)',
      f_test_time:'3',
      f_feedback_days:'3', f_decision_days:'5',
      f_tz:'At least 5h overlap with UTC+1',
      f_contract:'b2b',
      f_client:'Revealed at stage 1. A Nordic fintech, roughly 200 people.',
      f_min:'150', f_max:'200', f_currency:'PLN',
      f_benefits:'Paid leave is not included in a B2B contract. Conference budget of 8000 PLN per year, hardware of your choice.',
      f_required:'Go, PostgreSQL, Kubernetes, experience running distributed systems in production',
      f_nice:'Kafka, Terraform, previous work in a regulated financial environment',
      f_expect:[
        'Own services end to end, including what happens when they page you at night',
        'Review other people code with specifics rather than approvals',
        'Work asynchronously and write decisions down, since the team spans four countries',
      ].join('\n'),
    },
  },

  {
    id:'data-analyst-freelance-brazil',
    stages:[
      { what:'Conversa sobre o âmbito do projeto', minutes:'30' },
      { what:'Sessão técnica com live coding em SQL', minutes:'60' },
    ],
    label:'Data Analyst, Brazil',
    note:'Remote, freelance, paid by the hour',
    lang:'pt',
    state:{ test:'live', testUnit:'hours', mode:'remote', bond:'direct', period:'hour' },
    fields:{
      f_title:'Analista de Dados (freelancer)',
      f_test_time:'1',
      f_feedback_days:'2', f_decision_days:'5',
      f_tz:'Pelo menos 4h de sobreposição com UTC-3',
      f_contract:'freelance',
      f_min:'90', f_max:'130', f_currency:'BRL',
      f_benefits:'N/A. Prestação de serviços sem benefícios associados. Faturação mensal, pagamento a 15 dias.',
      f_required:'SQL, Power BI ou Metabase, modelação dimensional',
      f_nice:'Python, dbt, experiência com e-commerce',
      f_expect:[
        'Entregar dashboards que respondem a perguntas de negócio, não apenas gráficos bonitos',
        'Validar os números com quem os vai usar antes de dar o trabalho por fechado',
        'Estimar o esforço por entrega e avisar cedo quando a estimativa muda',
      ].join('\n'),
    },
  },

  /* Candidate cards. Written as answers to the job posts above would be
     read: the same option values, so the two sides line up. */

  {
    id:'candidate-data-engineer-portugal',
    doc:'card',
    label:'Data Engineer, Lisbon',
    note:'Candidate card: remote or hybrid, open to freelance',
    lang:'pt',
    state:{
      cardModes:['remote','hybrid'], cardDaysUnit:'week',
      cardContracts:['permanent','freelance'],
      cardAgency:'yes',
      cardNoticeUnit:'month',
      cardPeriod:'year',
      cardRelocate:'depends',
    },
    techs:[
      { name:'SQL',       years:'7' },
      { name:'dbt',       years:'3' },
      { name:'Python',    years:'5' },
      { name:'Snowflake', years:'3' },
      { name:'Airflow',   years:'2' },
    ],
    fields:{
      c_name:'Ana Silva, Engenheira de Dados',
      c_location:'Lisboa, UTC+0',
      c_days:'2',
      c_contract_note:'Como freelancer, trabalhador independente sem empresa, disposto a abrir uma',
      c_notice:'1',
      c_min:'40000', c_max:'48000', c_currency:'EUR',
      c_relocate_cond:'Só dentro da UE, com apoio à mudança',
    },
  },

  {
    id:'candidate-backend-engineer-poland',
    doc:'card',
    label:'Backend Engineer, Kraków',
    note:'Candidate card: remote only, B2B, can start now',
    lang:'en',
    state:{
      cardModes:['remote'],
      cardContracts:['b2b','contractor'],
      cardAgency:'no',
      cardNoticeUnit:'week',
      cardPeriod:'hour',
      cardRelocate:'no',
    },
    techs:[
      { name:'Go',         years:'6' },
      { name:'PostgreSQL', years:'8' },
      { name:'Kubernetes', years:'4' },
      { name:'Kafka',      years:'1.5' },
    ],
    fields:{
      c_name:'Senior Backend Engineer (Go)',
      c_location:'Kraków, UTC+1',
      c_contract_note:'Own company registered in Poland, invoices monthly with VAT',
      c_notice:'0',
      c_min:'170', c_currency:'PLN',
    },
  },

];
