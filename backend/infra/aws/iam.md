This repository does not yet ship full AWS IAM automation.

Minimum direction for future non-local deployment:

- separate runtime role for app container
- least-privilege access to object storage bucket
- separate secret access policy for secret manager reads
- read-only metrics/log shipping permissions where applicable

Until IAM is codified, treat this file as a placeholder and document any manual policy outside the app code review.
