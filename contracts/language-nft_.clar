;; Language NFT Contract

(define-non-fungible-token language-nft uint)

(define-data-var last-token-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

(define-map token-metadata
  { token-id: uint }
  {
    language: (string-ascii 64),
    contribution-type: (string-ascii 32),
    contributor: principal
  }
)

(define-public (mint (recipient principal) (language (string-ascii 64)) (contribution-type (string-ascii 32)))
  (let
    ((token-id (+ (var-get last-token-id) u1)))
    (try! (nft-mint? language-nft token-id recipient))
    (map-set token-metadata
      { token-id: token-id }
      {
        language: language,
        contribution-type: contribution-type,
        contributor: recipient
      }
    )
    (var-set last-token-id token-id)
    (ok token-id)
  )
)

(define-read-only (get-token-metadata (token-id uint))
  (map-get? token-metadata { token-id: token-id })
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? language-nft token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (nft-transfer? language-nft token-id sender recipient)
  )
)

