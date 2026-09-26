# AI Usage and Human Review

## Development

AI-assisted development was used to scaffold the user interface, API structure, seed assessment questions and documentation. All generated security examples are constrained to authorized training contexts.

## Runtime features

The reviewer screen presents a deterministic illustrative review suggestion (score, confidence, strengths and a prompt for reviewer questioning). It is demo content, not a model inference, not trained on candidate records, and not evidence of automated vulnerability validation.

## Ranking and review assistance

The backend stores explicit reviewer decisions and score separately from any advisory. This MVP does not run an AI ranking pipeline. Capability signals in the front end are synthetic demo values.

## Human control and limitations

Only an authorized human reviewer can verify a finding or assign its final score. Recruiters decide whom to interview. An advisory can miss context, overstate severity, or produce misleading confidence; it must never be used as a hiring decision or a substitute for evidence review.
