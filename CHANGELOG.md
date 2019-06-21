# Changelog

## [Unreleased]

## [1.1.0] - 2019/06/21

### Changed

-   Replace libxml-xsd by libxmljs as libxml-xsd is not maintained and does not support node >= 9.
    This was a problem as we want to keep at least on top of supported LTS versions

-   Having to bump to a minor version because of an npm issue.

## [1.0.1] - 2018/11/01

### Fixed

-   Allow for query params in idp login url. This means that we can work with login urls that have a query
    parameter.

## [1.0.0] - 2018/07/30

### Changed

-   `xmldsig-core-schema.xsd` `X509SerialNumber` is now a string. There is an issue with the c library we
    are relying on to check the xsd. That issue is due to the fact that the specs for xsd allow limiting
    the max integer size depending on the processor the checks are running on but at the same time allow
    for unlimited length integers.  
    This is documented here because it's an important change to the standard
    schema.

## [0.5.1] - 2018/07/30

### Changed

-   Release script tagging strategy - this should not impact the end users

## [0.5.0] - 2018/07/30

### Added

-   Started the changelog
-   forceAuthNByDefault boolean in service provider preferences.
    It is the for the optional `forceAuthentication` boolean of the `buildLoginRequestRedirectURL()` function.
    This should be used when you want to forceAuthentication by default without passing a boolean each time to
    `buildLoginRequestRedirectURL()` but still be able to sometimes not force the authentication
    By default it is `false` - this preserves the backwards compatibility.

### Changed

-   Release script - this should not impact the end users

## [0.4.2] - 2018/07/28

There was no changelog prior to this date. If requested we can go through it and add one.
