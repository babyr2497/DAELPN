;; Language Exchange Contract

(define-map exchange-sessions
  { session-id: uint }
  {
    language-a: (string-ascii 64),
    language-b: (string-ascii 64),
    participant-a: principal,
    participant-b: principal,
    status: (string-ascii 16)
  }
)

(define-map user-languages
  { user: principal }
  { languages: (list 10 (string-ascii 64)) }
)

(define-data-var last-session-id uint u0)

(define-constant err-invalid-status (err u100))
(define-constant err-not-participant (err u101))

(define-public (register-languages (languages (list 10 (string-ascii 64))))
  (ok (map-set user-languages { user: tx-sender } { languages: languages }))
)

(define-public (create-session (language-a (string-ascii 64)) (language-b (string-ascii 64)))
  (let
    ((new-id (+ (var-get last-session-id) u1)))
    (map-set exchange-sessions
      { session-id: new-id }
      {
        language-a: language-a,
        language-b: language-b,
        participant-a: tx-sender,
        participant-b: tx-sender,
        status: "open"
      }
    )
    (var-set last-session-id new-id)
    (ok new-id)
  )
)

(define-public (join-session (session-id uint))
  (let
    ((session (unwrap! (map-get? exchange-sessions { session-id: session-id }) (err u404))))
    (asserts! (is-eq (get status session) "open") err-invalid-status)
    (asserts! (not (is-eq (get participant-a session) tx-sender)) err-not-participant)
    (map-set exchange-sessions
      { session-id: session-id }
      (merge session
        {
          participant-b: tx-sender,
          status: "in-progress"
        }
      )
    )
    (ok true)
  )
)

(define-public (complete-session (session-id uint))
  (let
    ((session (unwrap! (map-get? exchange-sessions { session-id: session-id }) (err u404))))
    (asserts! (or (is-eq (get participant-a session) tx-sender) (is-eq (get participant-b session) tx-sender)) err-not-participant)
    (asserts! (is-eq (get status session) "in-progress") err-invalid-status)
    (map-set exchange-sessions
      { session-id: session-id }
      (merge session { status: "completed" })
    )
    (ok true)
  )
)

(define-read-only (get-session (session-id uint))
  (map-get? exchange-sessions { session-id: session-id })
)

(define-read-only (get-user-languages (user principal))
  (map-get? user-languages { user: user })
)

