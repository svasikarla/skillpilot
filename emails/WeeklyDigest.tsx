import {
  Html, Head, Body, Container, Heading, Text, Link, Section, Hr, Row, Column,
} from '@react-email/components'

interface JobMatch {
  title:      string
  platform:   string
  matchScore: number
  url:        string
}

interface Props {
  displayName:  string
  jobs:         JobMatch[]
  winsThisWeek: number
  upskillTip:   string | null
  appUrl:       string
}

export function WeeklyDigest({ displayName, jobs, winsThisWeek, upskillTip, appUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0' }}>

          {/* Header */}
          <Section style={{ backgroundColor: '#0f172a', borderRadius: '8px 8px 0 0', padding: '24px 32px' }}>
            <Heading style={{ color: '#ffffff', fontSize: 18, margin: 0 }}>
              Your weekly AI/ML jobs digest
            </Heading>
            <Text style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Hi {displayName} — here&apos;s what&apos;s new this week
            </Text>
          </Section>

          <Section style={{ padding: '24px 32px' }}>

            {/* Group win */}
            {winsThisWeek > 0 && (
              <Section style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '12px 16px', marginBottom: 20 }}>
                <Text style={{ color: '#15803d', fontSize: 13, margin: 0 }}>
                  🎉 <strong>{winsThisWeek} win{winsThisWeek > 1 ? 's' : ''}</strong> landed by the group this week. The community is closing deals.
                </Text>
              </Section>
            )}

            {/* Top jobs */}
            {jobs.length > 0 ? (
              <>
                <Heading as="h2" style={{ fontSize: 14, color: '#1e293b', marginTop: 0, marginBottom: 12 }}>
                  Top {jobs.length} new match{jobs.length > 1 ? 'es' : ''} for you
                </Heading>
                {jobs.map((job, i) => (
                  <Row key={i} style={{ marginBottom: 12 }}>
                    <Column>
                      <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: 12 }}>
                        <Link href={`${appUrl}/app/feed`} style={{ color: '#1e293b', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                          {job.title}
                        </Link>
                        <Text style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>
                          {job.platform} · {job.matchScore}% match
                        </Text>
                      </div>
                    </Column>
                  </Row>
                ))}
              </>
            ) : (
              <Text style={{ color: '#64748b', fontSize: 13 }}>
                No new high-match jobs this week. Keep your profile updated to improve matches.
              </Text>
            )}

            {/* Upskill nudge */}
            {upskillTip && (
              <>
                <Hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />
                <Text style={{ fontSize: 13, color: '#1e293b', margin: '0 0 4px' }}>
                  <strong>Upskill nudge</strong>
                </Text>
                <Text style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                  {upskillTip}
                </Text>
              </>
            )}

            <Hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

            <Link
              href={`${appUrl}/app/feed`}
              style={{ backgroundColor: '#6366f1', color: '#ffffff', padding: '10px 20px', borderRadius: 6, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}
            >
              View all jobs →
            </Link>

          </Section>

          {/* Footer */}
          <Section style={{ padding: '12px 32px 20px', borderTop: '1px solid #f1f5f9' }}>
            <Text style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
              You&apos;re receiving this because you&apos;re a member of the AI/ML Freelance Hub.{' '}
              <Link href={`${appUrl}/app/settings`} style={{ color: '#94a3b8' }}>Unsubscribe</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export default WeeklyDigest
