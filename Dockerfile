FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MemoLib.Api.csproj", "."]
RUN dotnet restore "./MemoLib.Api.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "MemoLib.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MemoLib.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Security: Run as non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

ENTRYPOINT ["dotnet", "MemoLib.Api.dll"]