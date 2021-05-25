import {
  ServerError,
  ResourceUnknownError,
  ResourceAlreadyExistsError,
  ApiError,
  HttpError,
  FieldFormatError,
  UnsupportedResponseTypeError,
  NoPermissionError,
  CallbackNotValidError,
  UserNotAuthenticatedError,
  EmptyBodyError,
  NotEnoughMfaMethodsError,
  InvalidMfaCodeError,
  AuthenticationError,
  LoginTimeoutError,
  LoginFreezeError,
  TooManyFailedAttemptsError,
  InvalidPresenceTokenError,
  InvalidGrantError,
  MfaRequiredError,
  MissingRequiredFieldsError,
  IllegalArgumentError,
  IllegalStateError,
  PasswordError,
  EmailUsedError,
  EmailUnknownError,
  NotActivatedError,
  NewPasswordHashUnknownError,
  AlreadyActivatedError,
  ActivationUnknownError,
  InvalidTokenError,
  UnauthorizedTokenError,
  TokenNotDeleteableError,
  FileTooLargeError,
  StatusInUseError,
  MfaReattemptDelayError,
  LockedDocumentError,
  OauthTokenError,
  OauthKeyError,
  LocalizationKeyMissingError,
  TemplateFillingError,
  ApplicationUnknownError,
  InvalidRequestError,
  UnsupportedGrantTypeError,
  InvalidClientError,
  ApplicationNotAuthenticatedError,
  InvalidMfaTokenError,
  OauthSignatureError,
  AccessTokenExpiredError,
  AccessTokenUnknownError,
  DuplicateRequestError,
} from './errors';

export const ErrorClassDefinitionsMap = {
  1: ServerError,
  10: NoPermissionError,
  13: EmptyBodyError,
  14: MissingRequiredFieldsError,
  15: FieldFormatError,
  16: ResourceUnknownError,
  17: ResourceAlreadyExistsError,
  26: IllegalArgumentError,
  27: IllegalStateError,
  101: ApplicationNotAuthenticatedError,
  103: ApplicationUnknownError,
  104: UserNotAuthenticatedError,
  106: AuthenticationError,
  107: OauthKeyError,
  108: OauthTokenError,
  109: OauthSignatureError,
  110: DuplicateRequestError,
  113: CallbackNotValidError,
  114: UnsupportedResponseTypeError,
  117: AccessTokenUnknownError,
  118: AccessTokenExpiredError,
  129: MfaRequiredError,
  130: InvalidMfaCodeError,
  131: InvalidMfaTokenError,
  132: InvalidPresenceTokenError,
  133: NotEnoughMfaMethodsError,
  134: MfaReattemptDelayError,
  202: EmailUnknownError,
  203: EmailUsedError,
  204: NotActivatedError,
  205: ActivationUnknownError,
  206: AlreadyActivatedError,
  207: NewPasswordHashUnknownError,
  208: PasswordError,
  211: LoginTimeoutError,
  212: LoginFreezeError,
  213: TooManyFailedAttemptsError,
  414: StatusInUseError,
  415: LockedDocumentError,
  1002: LocalizationKeyMissingError,
  1003: TemplateFillingError,
  2605: InvalidTokenError,
  2606: UnauthorizedTokenError,
  2607: TokenNotDeleteableError,
  2610: FileTooLargeError,
};

const ErrorClassDifinitionsByErrorMap = {
  invalid_grant: InvalidGrantError,
  invalid_request: InvalidRequestError,
  unsupported_grant_type: UnsupportedGrantTypeError,
  mfa_required: MfaRequiredError,
  invalid_client: InvalidClientError,
};

export function typeReceivedError(error: HttpError) {
  const ErrorClassDefinition =
    ErrorClassDefinitionsMap[error?.response?.data?.code];

  if (ErrorClassDefinition) {
    return ErrorClassDefinition.createFromHttpError(error);
  }

  const ErrorClassDefinitionByCode =
    ErrorClassDifinitionsByErrorMap[error?.response?.data?.error];

  if (ErrorClassDefinitionByCode) {
    return ErrorClassDefinitionByCode.createFromHttpError(error);
  }

  return ApiError.createFromHttpError(error);
}
