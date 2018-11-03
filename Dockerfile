### Build image
FROM microsoft/dotnet:2.1-sdk-alpine AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY *.sln ./
COPY */*.csproj ./
RUN for file in $(ls *.csproj); do mkdir -p ./${file%.*}/ && mv $file ./${file%.*}/; done
RUN dotnet restore

# Copy everything else
COPY . ./

# Build
RUN dotnet build


### Publish image
FROM build AS publish

# Add IL Linker package
WORKDIR /app/RaidersInnBot
RUN dotnet add package ILLink.Tasks -v 0.1.5-preview-1841731 -s https://dotnet.myget.org/F/dotnet-core/api/v3/index.json

# Publish
RUN dotnet publish -c Release -r linux-musl-x64 -o /app/out /p:ShowLinkerSizeComparison=true


### Runtime image
FROM microsoft/dotnet:2.1-runtime-deps-alpine AS runtime
LABEL maintainer "Archomeda (https://github.com/Archomeda/raiders-inn-bot)"

WORKDIR /app
COPY --from=publish /app/out ./

RUN mkdir config
VOLUME /app/config

ENTRYPOINT [ "dotnet", "RaidersInnBot.dll" ]
